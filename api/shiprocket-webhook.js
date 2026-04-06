// api/shiprocket-webhook.js
// Delivered hone pe — email + SMS dono jaate hain

import { createClient }   from '@supabase/supabase-js';
import nodemailer          from 'nodemailer';
import { sendSmsServer }   from './send-sms.js';

const supabase = createClient(
  process.env.SUPABASE_URL            || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function mapSrStatus(srStatus = '') {
  const s = srStatus.toUpperCase().trim().replace(/-/g, ' ');
  if (['NEW', 'INVOICED', 'READY TO SHIP', 'PICKUP GENERATED', 'LABEL GENERATED',
       'MANIFEST GENERATED', 'PICKUP SCHEDULED'].includes(s))                         return 'confirmed';
  if (['PICKUP QUEUED', 'PICKUP ERROR', 'PICKUP RESCHEDULED', 'MANIFESTED',
       'SELF FULFILLED'].includes(s))                                                  return 'processing';
  if (s.includes('SHIPPED') || s.includes('IN TRANSIT') || s.includes('DISPATCHED') ||
      s.includes('OUT FOR DELIVERY') || s.includes('REACHED DESTINATION') ||
      s.includes('REACHED CITY') || s.includes('MISROUTED') ||
      ['PACKET ARRIVED AT GATEWAY', 'PACKET DEPARTED FROM GATEWAY'].includes(s))      return 'shipped';
  if (s === 'DELIVERED' || s === 'DELIVERY DONE')                                     return 'delivered';
  if (s.includes('CANCEL') || s.includes('RTO') || s === 'LOST')                     return 'cancelled';
  return null;
}

function makeTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function deliveryEmailHtml(name, orderNum, total) {
  const INR      = (n) => `₹${n.toLocaleString('en-IN')}`;
  const SITE_URL = process.env.SITE_URL || 'https://wavesandwires.in';
  const BRAND    = '#f5c018';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:0;">Your order #${orderNum} delivered! 📦</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
  <span style="font-size:22px;font-weight:900;color:${BRAND};">Waves &amp; Wires</span>
</td></tr>
<tr><td style="background:#fff;padding:36px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;width:64px;height:64px;line-height:64px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:50%;font-size:32px;">📦</div>
    <h2 style="margin:14px 0 6px;font-size:24px;font-weight:800;color:#111;">Order Delivered!</h2>
    <p style="margin:0;font-size:14px;color:#6b7280;">Hi ${name}, your order has arrived.</p>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
    <tr><td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;">
      <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;display:block;">Order</span>
      <span style="font-size:15px;font-weight:800;color:#111;">#${orderNum}</span>
    </td><td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
      <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;display:block;">Amount</span>
      <span style="font-size:15px;font-weight:700;color:#111;">${INR(total)}</span>
    </td></tr>
  </table>
  <div style="text-align:center;">
    <a href="${SITE_URL}/order-tracking?order=${orderNum}"
       style="display:inline-block;background:${BRAND};color:#111;font-weight:800;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:13px;">
      View Order →
    </a>
  </div>
</td></tr>
<tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid #e5e7eb;border-top:none;">
  <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Waves & Wires Technologies LLP · Mumbai</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendDeliveryEmail(toEmail, name, orderNum, total) {
  try {
    const transporter = makeTransporter();
    await transporter.sendMail({
      from:    `"${process.env.FROM_NAME || 'Waves & Wires'}" <${process.env.SMTP_USER}>`,
      to:      toEmail,
      subject: `Your order #${orderNum} has been delivered! 📦`,
      html:    deliveryEmailHtml(name, orderNum, total),
    });
    console.log(`[Webhook] Delivery email sent to ${toEmail}`);
  } catch (err) {
    console.error('[Webhook] Delivery email failed:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;

    if (!data || !data.order_id) {
      return res.status(200).json({ status: 'ok', message: 'Webhook active' });
    }

    const srOrderId = String(data.order_id);
    const newStatus = mapSrStatus(data.current_status);

    console.log(`[Webhook] SR order ${srOrderId} | Raw: "${data.current_status}" → Mapped: "${newStatus ?? 'unchanged'}"`);

    const update = { updated_at: new Date().toISOString() };
    if (newStatus)           update.status                 = newStatus;
    if (data.awb)            update.awb_code               = String(data.awb);
    if (data.courier_name)   update.courier_name           = data.courier_name;
    if (data.shipment_id)    update.shiprocket_shipment_id = String(data.shipment_id);
    if (data.current_status) update.shiprocket_status      = data.current_status;

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(update)
      .eq('shiprocket_order_id', srOrderId)
      .select('id, order_number, total, user_id, shipping_address')
      .single();

    if (error) {
      console.warn('[Webhook] Order not found for SR ID:', srOrderId, error.message);
      return res.status(200).json({ status: 'ok', note: 'order not found' });
    }

    // ── Delivered: Email + SMS dono bhejo ─────────────────────────────────
    if (newStatus === 'delivered' && updatedOrder?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, phone, full_name')
        .eq('id', updatedOrder.user_id)
        .single();

      const customerName = updatedOrder.shipping_address?.full_name ?? profile?.full_name ?? 'Customer';

      // Email
      if (profile?.email) {
        sendDeliveryEmail(
          profile.email,
          customerName,
          updatedOrder.order_number,
          updatedOrder.total
        );
      }

      // SMS
      if (profile?.phone) {
        sendSmsServer(profile.phone, 'order_delivered', {
          orderNum: updatedOrder.order_number,
          total:    updatedOrder.total,
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Webhook Error]', err.message);
    return res.status(200).json({ error: err.message });
  }
}