-- ============================================================
-- WAVES & WIRES — fixes3_RUNNOW.sql
-- Supabase SQL Editor mein NEW SNIPPET mein paste karke Run karo
-- ============================================================

-- ── 1. Order number se quotes hatao ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prefix TEXT;
  seq    BIGINT;
BEGIN
  SELECT TRIM(BOTH '"' FROM value::text)
  INTO prefix
  FROM public.store_settings WHERE key = 'order_prefix';

  seq := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000000;
  NEW.order_number := COALESCE(prefix, 'WW') || '-' || LPAD(seq::TEXT, 7, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- ── 2. purana decrement_stock trigger hatao ──────────────────────────────
-- (ab place_order RPC handle karega — trigger double decrement karta tha)
DROP TRIGGER IF EXISTS on_order_item_insert ON public.order_items;

-- ── 3. place_order — ek hi RPC mein sab kuch atomic ──────────────────────
-- order create, items insert, stock decrement, coupon increment — sab ek transaction mein
CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id         UUID,
  p_items           JSONB,
  p_payment_method  TEXT,
  p_payment_status  TEXT,
  p_payment_ref     TEXT,
  p_subtotal        NUMERIC,
  p_discount        NUMERIC,
  p_shipping        NUMERIC,
  p_tax             NUMERIC,
  p_total           NUMERIC,
  p_coupon_id       UUID,
  p_coupon_code     TEXT,
  p_shipping_address JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order_id     UUID;
  v_order_number TEXT;
  v_item         JSONB;
  v_stock        INT;
  v_product_name TEXT;
BEGIN
  -- Auth check
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Stock check: pehle sab items ke liye stock verify karo
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT stock, name INTO v_stock, v_product_name
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID AND is_active = TRUE;

    IF v_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Product not found or inactive');
    END IF;

    IF v_stock < (v_item->>'quantity')::INT THEN
      RETURN jsonb_build_object('success', false,
        'error', 'Insufficient stock for: ' || v_product_name ||
                 ' (available: ' || v_stock || ')');
    END IF;
  END LOOP;

  -- Order create karo
  INSERT INTO public.orders (
    user_id, status, payment_status, payment_method, payment_ref,
    subtotal, discount, shipping, tax, total,
    coupon_id, coupon_code, shipping_address
  ) VALUES (
    p_user_id, 'pending', p_payment_status, p_payment_method, p_payment_ref,
    p_subtotal, p_discount, p_shipping, p_tax, p_total,
    p_coupon_id, p_coupon_code, p_shipping_address
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- Order items insert karo + stock decrement
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Order item insert
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, product_sku, quantity, price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'name',
      v_item->>'image',
      v_item->>'sku',
      (v_item->>'quantity')::INT,
      (v_item->>'price')::NUMERIC
    );

    -- Stock decrement (SECURITY DEFINER mein hai toh RLS bypass hoga)
    UPDATE public.products
    SET stock      = GREATEST(0, stock - (v_item->>'quantity')::INT),
        updated_at = NOW()
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- Coupon usage increment
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = p_coupon_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_number', v_order_number,
    'order_id', v_order_id::text
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(
  UUID, JSONB, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC,
  UUID, TEXT, JSONB
) TO authenticated;

-- ── 4. Stock restore — admin ya user cancel/refund kare toh automatic ──────
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel_or_refund()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Sirf jab status pehli baar cancelled ya refunded ho
  IF NEW.status IN ('cancelled', 'refunded')
     AND OLD.status NOT IN ('cancelled', 'refunded') THEN

    UPDATE public.products p
    SET stock      = p.stock + oi.quantity,
        updated_at = NOW()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;

  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_cancelled_restore_stock ON public.orders;
CREATE TRIGGER on_order_cancelled_restore_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel_or_refund();

-- ── 5. cancel_order — ab trigger stock restore karega, manual nahi ─────────
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or access denied');
  END IF;

  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled at this stage');
  END IF;

  -- Status update → trigger automatic stock restore karega
  UPDATE public.orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  -- Coupon usage reverse
  IF v_order.coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = GREATEST(0, used_count - 1)
    WHERE id = v_order.coupon_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated;

-- ── 6. decrement_stock function recreate (SECURITY DEFINER) ──────────────
-- Yeh ab trigger se nahi chalega, lekin agar future mein chahiye toh ready hai
CREATE OR REPLACE FUNCTION public.decrement_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - NEW.quantity), updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

-- Trigger OFF rahega (place_order handle kar raha hai)
-- Agar direct order_items insert karna ho future mein toh uncomment karo:
-- CREATE TRIGGER on_order_item_insert
--   AFTER INSERT ON public.order_items
--   FOR EACH ROW EXECUTE FUNCTION public.decrement_stock();
