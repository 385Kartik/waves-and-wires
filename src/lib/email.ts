// ─── Shared constants ─────────────────────────────────────────────────────
const BRAND_COLOR = '#f5c018';
const SITE_URL    = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : '') || 'https://wavesandwires.in';
const INR         = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// ─── Base layout ──────────────────────────────────────────────────────────
function base(body: string, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Waves & Wires</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:0;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

      <!-- Logo header -->
      <tr>
        <td style="background:#1a1a1a;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:900;color:${BRAND_COLOR};letter-spacing:-0.5px;">Waves &amp; Wires</span>
          <p style="margin:3px 0 0;font-size:10px;color:#666;letter-spacing:2.5px;text-transform:uppercase;">Technologies LLP</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          ${body}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid #e5e7eb;border-top:none;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Waves & Wires Technologies LLP · Mumbai, India</p>
          <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">
            Questions? <a href="mailto:support@wavesandwires.in" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">support@wavesandwires.in</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── sendEmail (client-side fire-and-forget) ──────────────────────────────
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to, subject, html }),
    });
  } catch (err) {
    console.error('[sendEmail]', err);
  }
}

// ─── Welcome email ────────────────────────────────────────────────────────
export function welcomeEmailHtml(name: string): string {
  return base(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111;">Welcome, ${name}! 🎉</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      You're now part of the Waves & Wires family. Explore our range of premium electric appliances and enjoy a seamless shopping experience.
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:0 0 28px;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">🎁 First-time buyer?</p>
      <p style="margin:5px 0 0;font-size:13px;color:#78350f;">
        Use code <strong style="font-family:monospace;background:#fef3c7;padding:1px 6px;border-radius:4px;">WELCOME10</strong> at checkout for 10% off your first order.
      </p>
    </div>
    <a href="${SITE_URL}/shop" style="display:inline-block;background:${BRAND_COLOR};color:#111;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px;">
      Start Shopping →
    </a>
  `, `Welcome to Waves & Wires, ${name}!`);
}

// ─── Order Confirmation + Invoice ─────────────────────────────────────────
interface OrderConfirmParams {
  name:          string;
  orderNum:      string;
  items:         Array<{ product: { name: string; price: number }; quantity: number }>;
  subtotal:      number;
  discount:      number;
  shipping:      number;
  tax:           number;
  total:         number;
  paymentMethod: string;
}

export function orderConfirmHtml(p: OrderConfirmParams): string {
  const isPaid = p.paymentMethod === 'razorpay';

  const itemRows = p.items.map(item => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;line-height:1.4;">
        ${item.product.name}
      </td>
      <td style="padding:11px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#9ca3af;text-align:center;white-space:nowrap;">
        ×${item.quantity}
      </td>
      <td style="padding:11px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;text-align:right;font-weight:600;white-space:nowrap;">
        ${INR(item.product.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  return base(`
    <!-- Top badge -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:50%;font-size:28px;margin-bottom:14px;">✅</div>
      <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#111;">Order Confirmed!</h2>
      <p style="margin:0;font-size:14px;color:#6b7280;">Hi ${p.name}, we've received your order.</p>
    </div>

    <!-- Meta row -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:0;margin-bottom:28px;">
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;display:block;">Order Number</span>
          <span style="font-size:16px;font-weight:800;color:#111;">#${p.orderNum}</span>
        </td>
        <td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
          <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;display:block;">Payment</span>
          <span style="display:inline-block;margin-top:3px;background:${isPaid ? '#ecfdf5' : '#fffbeb'};color:${isPaid ? '#065f46' : '#92400e'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">
            ${isPaid ? '💳 Paid Online' : '💵 Cash on Delivery'}
          </span>
        </td>
      </tr>
    </table>

    <!-- Invoice header -->
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Invoice</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:4px;">
      <thead>
        <tr style="border-bottom:2px solid #e5e7eb;">
          <th style="padding:8px 0;font-size:11px;color:#9ca3af;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
          <th style="padding:8px 4px;font-size:11px;color:#9ca3af;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:8px 0;font-size:11px;color:#9ca3af;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Price breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">Subtotal</td><td style="font-size:13px;color:#374151;text-align:right;padding:5px 0;">${INR(p.subtotal)}</td></tr>
      ${p.discount > 0 ? `<tr><td style="padding:5px 0;font-size:13px;color:#059669;">Discount</td><td style="font-size:13px;color:#059669;text-align:right;padding:5px 0;">−${INR(p.discount)}</td></tr>` : ''}
      <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">Shipping</td><td style="font-size:13px;color:#374151;text-align:right;padding:5px 0;">${p.shipping > 0 ? INR(p.shipping) : '<span style="color:#059669;font-weight:600;">Free</span>'}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">GST (18%)</td><td style="font-size:13px;color:#374151;text-align:right;padding:5px 0;">${INR(p.tax)}</td></tr>
      <tr style="border-top:2px solid #e5e7eb;">
        <td style="padding:12px 0 0;font-size:17px;font-weight:800;color:#111;">Total</td>
        <td style="padding:12px 0 0;font-size:17px;font-weight:800;color:#111;text-align:right;">${INR(p.total)}</td>
      </tr>
    </table>

    <!-- Track CTA -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;text-align:center;">
      <p style="margin:0 0 14px;font-size:13px;color:#92400e;font-weight:600;">Track your shipment in real time.</p>
      <a href="${SITE_URL}/order-tracking?order=${p.orderNum}"
         style="display:inline-block;background:${BRAND_COLOR};color:#111;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:13px;">
        Track Order #${p.orderNum} →
      </a>
    </div>
  `, `Order #${p.orderNum} confirmed — ${INR(p.total)}`);
}

// ─── Cancel email ─────────────────────────────────────────────────────────
export function cancelEmailHtml(name: string, orderNum: string, total: number, reason: string, isOnline: boolean): string {
  return base(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:#fef2f2;border:2px solid #fca5a5;border-radius:50%;font-size:28px;margin-bottom:14px;">❌</div>
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111;">Order Cancelled</h2>
      <p style="margin:0;font-size:14px;color:#6b7280;">Hi ${name}, your order #${orderNum} has been cancelled.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Order</span><br/>
        <span style="font-size:15px;font-weight:800;color:#111;">#${orderNum}</span>
      </td>
      <td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Amount</span><br/>
        <span style="font-size:15px;font-weight:700;color:#111;">${INR(total)}</span>
      </td></tr>
      <tr><td colspan="2" style="padding:12px 18px;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Cancellation Reason</span><br/>
        <span style="font-size:13px;color:#374151;margin-top:3px;display:block;">${reason}</span>
      </td></tr>
    </table>

    ${isOnline ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:700;">💳 Refund Initiated</p>
      <p style="margin:6px 0 0;font-size:13px;color:#3b82f6;line-height:1.5;">
        Your refund of <strong>${INR(total)}</strong> will be credited to your original payment method within <strong>5–7 business days</strong>.
      </p>
    </div>` : ''}

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
      Questions? Contact us at <a href="mailto:support@wavesandwires.in" style="color:${BRAND_COLOR};font-weight:600;text-decoration:none;">support@wavesandwires.in</a>
    </p>
  `, `Order #${orderNum} has been cancelled`);
}

// ─── Refund request email ─────────────────────────────────────────────────
export function refundRequestHtml(name: string, orderNum: string, total: number): string {
  return base(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:#fffbeb;border:2px solid #fde68a;border-radius:50%;font-size:28px;margin-bottom:14px;">🔄</div>
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111;">Refund Request Received</h2>
      <p style="margin:0;font-size:14px;color:#6b7280;">Hi ${name}, we've received your request for order #${orderNum}.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Order</span><br/>
        <span style="font-size:15px;font-weight:800;color:#111;">#${orderNum}</span>
      </td>
      <td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Amount</span><br/>
        <span style="font-size:15px;font-weight:700;color:#111;">${INR(total)}</span>
      </td></tr>
    </table>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:700;">⏱ What happens next?</p>
      <p style="margin:8px 0 0;font-size:13px;color:#374151;line-height:1.5;">
        Our team will review your request within <strong>2–3 business days</strong> and get back to you via email.
      </p>
    </div>
  `, `Refund request received for order #${orderNum}`);
}

// ─── Delivery confirmation email ──────────────────────────────────────────
export function deliveryEmailHtml(name: string, orderNum: string, total: number): string {
  return base(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:50%;font-size:32px;margin-bottom:14px;">📦</div>
      <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#111;">Your Order is Delivered!</h2>
      <p style="margin:0;font-size:14px;color:#6b7280;">Hi ${name}, great news — your order has arrived!</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Order Number</span><br/>
        <span style="font-size:15px;font-weight:800;color:#111;">#${orderNum}</span>
      </td>
      <td style="padding:12px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Amount</span><br/>
        <span style="font-size:15px;font-weight:700;color:#111;">${INR(total)}</span>
      </td></tr>
      <tr><td colspan="2" style="padding:12px 18px;">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Status</span><br/>
        <span style="display:inline-block;margin-top:4px;background:#ecfdf5;color:#065f46;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">✓ Delivered</span>
      </td></tr>
    </table>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">💬 How was your experience?</p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.5;">
        Loved your purchase? We'd love to hear from you! If something isn't right, our team is always here to help.
      </p>
    </div>

    <div style="text-align:center;display:flex;gap:10px;justify-content:center;">
      <a href="${SITE_URL}/order-tracking?order=${orderNum}"
         style="display:inline-block;background:${BRAND_COLOR};color:#111;font-weight:800;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:13px;margin-right:8px;">
        View Order →
      </a>
      <a href="mailto:support@wavesandwires.in"
         style="display:inline-block;background:#f3f4f6;color:#374151;font-weight:700;padding:13px 24px;border-radius:10px;text-decoration:none;font-size:13px;">
        Need Help?
      </a>
    </div>
  `, `Your order #${orderNum} has been successfully delivered!`);
}