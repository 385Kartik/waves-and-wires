-- ============================================================
-- WAVES & WIRES — Security Patches + New Features
-- Run this AFTER schema.sql and fixes.sql
-- ============================================================

-- ── Refund Requests Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)   -- one refund request per order
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own refund requests"
  ON public.refund_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can create refund requests"
  ON public.refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins can manage refund requests"
  ON public.refund_requests FOR ALL USING (public.is_admin());

CREATE TRIGGER touch_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Secure Cancel Order Function ──────────────────────────────
-- Users can only cancel their OWN orders that are 'pending' or 'confirmed'
-- Prevents direct table UPDATE which could be exploited
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  -- Verify ownership & fetch order
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or access denied');
  END IF;

  -- Only allow cancel on pending / confirmed
  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled at this stage');
  END IF;

  -- Update order status
  UPDATE public.orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  -- Restore stock for all items
  UPDATE public.products p
  SET stock = p.stock + oi.quantity, updated_at = NOW()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND oi.product_id = p.id;

  -- Decrement coupon usage if coupon was used
  IF v_order.coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = GREATEST(0, used_count - 1)
    WHERE id = v_order.coupon_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── Secure Request Refund Function ────────────────────────────
-- Users can only request refund for their OWN delivered orders
CREATE OR REPLACE FUNCTION public.request_refund(p_order_id UUID, p_reason TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  -- Validate input
  IF LENGTH(TRIM(p_reason)) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please provide a detailed reason (min 10 chars)');
  END IF;

  -- Verify ownership
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or access denied');
  END IF;

  -- Only allow refund request on delivered orders
  IF v_order.status != 'delivered' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Refund can only be requested for delivered orders');
  END IF;

  -- Check if refund request already exists
  IF EXISTS (SELECT 1 FROM public.refund_requests WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'A refund request already exists for this order');
  END IF;

  -- Insert refund request
  INSERT INTO public.refund_requests (order_id, user_id, reason)
  VALUES (p_order_id, auth.uid(), TRIM(p_reason));

  -- Update order status to show refund pending
  UPDATE public.orders SET status = 'refunded', updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── Update Product Rating After Review ────────────────────────
-- Already exists but ensure it handles deletes properly
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products
  SET
    rating       = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE product_id = v_product_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = v_product_id),
    updated_at   = NOW()
  WHERE id = v_product_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- ── Security: Prevent SQL injection via RLS ───────────────────
-- Users cannot update orders directly
DROP POLICY IF EXISTS "users can update own orders" ON public.orders;

-- Only allow users to view reviews (write via policies)
DROP POLICY IF EXISTS "users can manage own reviews" ON public.reviews;
CREATE POLICY "users can insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ── Security: Rate limit review spam ─────────────────────────
-- Reviews table already has UNIQUE(product_id, user_id) — one review per product per user

-- ── Security: Restrict order number search (anon) ────────────
-- Guests can search by order number (for tracking) but only see non-sensitive fields
-- The existing policy "users can view own orders" covers auth users
-- For guest tracking, the current ilike search is acceptable since order numbers are random

-- ── Security: Add index for refund_requests ───────────────────
CREATE INDEX IF NOT EXISTS idx_refund_requests_order ON public.refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user  ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user          ON public.reviews(user_id);

-- ── Grant execute on new functions ───────────────────────────
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_refund(UUID, TEXT) TO authenticated;

-- ── Admin dashboard: include refund requests count ───────────
DROP VIEW IF EXISTS public.admin_dashboard_stats;
CREATE VIEW public.admin_dashboard_stats
WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM public.orders WHERE status != 'cancelled')                                AS total_orders,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')                                   AS pending_orders,
  (SELECT COALESCE(SUM(total),0) FROM public.orders WHERE payment_status = 'paid')                AS total_revenue,
  (SELECT COALESCE(SUM(total),0) FROM public.orders WHERE payment_status='paid'
     AND created_at::date = CURRENT_DATE)                                                         AS today_revenue,
  (SELECT COUNT(*) FROM public.profiles WHERE NOT is_admin)                                       AS total_customers,
  (SELECT COUNT(*) FROM public.profiles WHERE NOT is_admin
     AND created_at > NOW()-INTERVAL '30 days')                                                   AS new_customers_30d,
  (SELECT COUNT(*) FROM public.products WHERE is_active)                                          AS active_products,
  (SELECT COUNT(*) FROM public.products WHERE stock <= 5 AND is_active)                           AS low_stock_count,
  (SELECT COUNT(*) FROM public.refund_requests WHERE status = 'pending')                          AS pending_refunds;

GRANT SELECT ON public.admin_dashboard_stats TO authenticated;

-- ── Security Headers Note (add to your host / Netlify / Vercel) ──
-- X-Content-Type-Options: nosniff
-- X-Frame-Options: DENY
-- X-XSS-Protection: 1; mode=block
-- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
-- Referrer-Policy: strict-origin-when-cross-origin
-- Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; ...
-- (These are set in netlify.toml or vercel.json — see updated config files)
