import { createClient } from '@supabase/supabase-js';
import nodemailer        from 'nodemailer';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Status mapping ───────────────────────────────────────────────────────
function mapSrStatus(srStatus = '') {
  const s = srStatus.toUpperCase().trim();
  if (['NEW', 'INVOICED', 'READY TO SHIP'].includes(s))                                return 'confirmed';
  if (['PICKUP SCHEDULED', 'PICKUP QUEUED', 'MANIFESTED'].includes(s))                return 'processing';
  if (['SHIPPED', 'IN TRANSIT', 'OUT FOR DELIVERY',
       'REACHED DESTINATION HUB', 'REACHED CITY'].includes(s))                        return 'shipped';
  if (s === 'DELIVERED')                                                                return 'delivered';
  if (['CANCELED', 'CANCELLATION REQUESTED', 'RTO INITIATED',
       'RTO DELIVERED', 'LOST'].includes(s))                                           return 'cancelled';
  return null;
}

// ─── Nodemailer transporter ───────────────────────────────────────────────
function makeTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// ─── Delivery email HTML (server-side, no import.meta.env) ───────────────
function deliveryEmailHtml(name, orderNum, total) {
  const INR      = (n) => `₹${n.toLocaleString('en-IN')}`;
  const SITE_URL = process.env.SITE_URL || 'https://wavesandwires.in';
  const BRAND    = '#f5c018';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:0;">Your order #${orderNum} has been successfully delivered! 📦</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr>
        <td style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:900;color:${BRAND};">Waves &amp; Wires</span>
          <p style="margin:3px 0 0;font-size:10px;color:#666;letter-spacing:2.5px;text-transform:uppercase;">Technologies LLP</p>
        </td>
      </tr>
      <tr>
        <td style="background:#fff;padding:36px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;width:64px;height:64px;line-height:64px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:50%;font-size:32px;margin-bottom:14px;">📦</div>
            <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#111;">Your Order is Delivered!</h2>
            <p style="margin:0;font-size:14px;color:#6b7280;">Hi ${name}, your order has arrived successfully.</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
            <tr>
              <td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;display:block;">Order Number</span>
                <span style="font-size:15px;font-weight:800;color:#111;">#${orderNum}</span>
              </td>
              <td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
                <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;display:block;">Total Paid</span>
                <span style="font-size:15px;font-weight:700;color:#111;">${INR(total)}</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:12px 18px;">
                <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;display:block;">Status</span>
                <span style="display:inline-block;margin-top:4px;background:#ecfdf5;color:#065f46;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">✓ Delivered</span>
              </td>
            </tr>
          </table>

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">💬 How was your experience?</p>
            <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.5;">
              Loved your purchase? We'd love to hear from you! If something isn't right, our support team is always here to help.
            </p>
          </div>

          <div style="text-align:center;">
            <a href="${SITE_URL}/order-tracking?order=${orderNum}"
               style="display:inline-block;background:${BRAND};color:#111;font-weight:800;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:13px;margin-right:8px;">
              View Order →
            </a>
            <a href="mailto:support@wavesandwires.in"
               style="display:inline-block;background:#f3f4f6;color:#374151;font-weight:700;padding:13px 24px;border-radius:10px;text-decoration:none;font-size:13px;">
              Need Help?
            </a>
          </div>

        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Waves & Wires Technologies LLP · Mumbai, India</p>
          <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">
            Questions? <a href="mailto:support@wavesandwires.in" style="color:${BRAND};text-decoration:none;font-weight:600;">support@wavesandwires.in</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Send delivery email via nodemailer ───────────────────────────────────
async function sendDeliveryEmail(toEmail, name, orderNum, total) {
  try {
    const transporter = makeTransporter();
    await transporter.sendMail({
      from:    `"${process.env.FROM_NAME || 'Waves & Wires'}" <${process.env.SMTP_USER}>`,
      to:      toEmail,
      subject: `Your order #${orderNum} has been delivered! 📦`,
      html:    deliveryEmailHtml(name, orderNum, total),
    });
    console.log(`[Webhook] Delivery email sent → ${toEmail}`);
  } catch (err) {
    // Email failure shouldn't block webhook response
    console.error('[Webhook] Delivery email failed:', err.message);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;

    // Shiprocket handshake / connectivity test
    if (!data || !data.order_id) {
      return res.status(200).json({ status: 'ok', message: 'Webhook active' });
    }

    const srOrderId = String(data.order_id);
    const newStatus = mapSrStatus(data.current_status);

    // Selectively build update object (only update fields that arrived)
    const update = { updated_at: new Date().toISOString() };
    if (newStatus)           update.status                   = newStatus;
    if (data.awb)            update.awb_code                 = String(data.awb);
    if (data.courier_name)   update.courier_name             = data.courier_name;
    if (data.shipment_id)    update.shiprocket_shipment_id   = String(data.shipment_id);

    // Update the order
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(update)
      .eq('shiprocket_order_id', srOrderId)
      .select('id, order_number, total, user_id, shipping_address')
      .single();

    if (error) throw error;

    // ── Delivery email trigger ────────────────────────────────────────────
    // Only fires when webhook explicitly pushes DELIVERED status
    if (newStatus === 'delivered' && updatedOrder?.user_id) {
      // Fetch user email from profiles table (service role can read this)
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', updatedOrder.user_id)
        .single();

      const recipientEmail = profile?.email;
      const customerName   = updatedOrder.shipping_address?.full_name ?? 'Customer';

      if (recipientEmail) {
        // Fire and forget — don't await so webhook responds fast
        sendDeliveryEmail(
          recipientEmail,
          customerName,
          updatedOrder.order_number,
          updatedOrder.total,
        );
      }
    }

    console.log(`[Webhook] SR ${srOrderId} → ${newStatus ?? '(no status change)'} | AWB: ${data.awb ?? '-'}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    // Always 200 so Shiprocket doesn't retry-loop
    console.error('[Webhook Error]', err.message);
    return res.status(200).json({ error: err.message });
  }
}