-- ============================================================
-- WAVES & WIRES — Fixes 2
-- Run AFTER schema.sql + fixes.sql + security_and_features.sql
-- ============================================================

-- ── Fix 1: reviewer_name in reviews (solves "review nahi dikh raha" bug) ──
-- The profiles RLS blocks joining names for other users.
-- Store name directly in reviews table.

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Backfill existing reviews from profiles
UPDATE public.reviews r
SET reviewer_name = p.full_name
FROM public.profiles p
WHERE p.id = r.user_id AND r.reviewer_name IS NULL;

-- Trigger: auto-fill reviewer_name on new review insert
CREATE OR REPLACE FUNCTION public.fill_reviewer_name()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  SELECT full_name INTO NEW.reviewer_name
  FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.reviewer_name IS NULL THEN
    NEW.reviewer_name := 'Customer';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_insert_fill_name ON public.reviews;
CREATE TRIGGER on_review_insert_fill_name
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.fill_reviewer_name();

-- ── Fix 2: request_refund — do NOT change order status immediately ─────────
-- Previously set status='refunded' right away — wrong. Admin should control that.
CREATE OR REPLACE FUNCTION public.request_refund(p_order_id UUID, p_reason TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF LENGTH(TRIM(p_reason)) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please provide a reason (min 10 characters)');
  END IF;

  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or access denied');
  END IF;

  IF v_order.status != 'delivered' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Refund can only be requested for delivered orders');
  END IF;

  IF EXISTS (SELECT 1 FROM public.refund_requests WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'A refund request already exists for this order');
  END IF;

  -- Only create the request — do NOT change order status
  INSERT INTO public.refund_requests (order_id, user_id, reason)
  VALUES (p_order_id, auth.uid(), TRIM(p_reason));

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_refund(UUID, TEXT) TO authenticated;

-- ── Fix 3: contact_messages table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can submit a message
CREATE POLICY "anyone can insert contact messages"
  ON public.contact_messages FOR INSERT WITH CHECK (TRUE);

-- Only admins can read
CREATE POLICY "admins can manage contact messages"
  ON public.contact_messages FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_unread  ON public.contact_messages(is_read) WHERE is_read = FALSE;

-- ── Fix 4: store_phones — multiple phone numbers support ─────────────────────
-- store_phones is a JSON array: ["number1", "number2"]
INSERT INTO public.store_settings (key, value)
VALUES ('store_phones', '["+91 98765 43210"]')
ON CONFLICT (key) DO NOTHING;

-- ── Fix 5: Update admin_dashboard_stats to count unread messages ─────────────
DROP VIEW IF EXISTS public.admin_dashboard_stats;
CREATE VIEW public.admin_dashboard_stats
WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM public.orders WHERE status != 'cancelled')                         AS total_orders,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')                            AS pending_orders,
  (SELECT COALESCE(SUM(total),0) FROM public.orders WHERE payment_status = 'paid')         AS total_revenue,
  (SELECT COALESCE(SUM(total),0) FROM public.orders WHERE payment_status='paid'
     AND created_at::date = CURRENT_DATE)                                                  AS today_revenue,
  (SELECT COUNT(*) FROM public.profiles WHERE NOT is_admin)                                AS total_customers,
  (SELECT COUNT(*) FROM public.profiles WHERE NOT is_admin
     AND created_at > NOW()-INTERVAL '30 days')                                            AS new_customers_30d,
  (SELECT COUNT(*) FROM public.products WHERE is_active)                                   AS active_products,
  (SELECT COUNT(*) FROM public.products WHERE stock <= 5 AND is_active)                    AS low_stock_count,
  (SELECT COUNT(*) FROM public.refund_requests WHERE status = 'pending')                   AS pending_refunds,
  (SELECT COUNT(*) FROM public.contact_messages WHERE NOT is_read)                         AS unread_messages;

GRANT SELECT ON public.admin_dashboard_stats TO authenticated;
GRANT SELECT ON public.admin_revenue_by_day TO authenticated;
GRANT SELECT ON public.admin_top_products TO authenticated;
