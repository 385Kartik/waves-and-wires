const RESEND_API = 'https://api.resend.com/emails';
const FROM = 'Waves & Wires <onboarding@resend.dev>';
const KEY  = () => (import.meta.env.VITE_RESEND_API_KEY as string) ?? '';

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY()}` },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
  } catch { /* never block user flow */ }
}

const wrap = (content: string) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:#f5c018;padding:24px 28px;text-align:center">
    <h1 style="margin:0;font-size:20px;font-weight:900;color:#000">Waves &amp; Wires</h1>
    <p style="margin:4px 0 0;font-size:12px;color:rgba(0,0,0,0.6)">Premium Appliances</p>
  </div>
  ${content}
  <div style="background:#f8f8f8;padding:16px 28px;text-align:center;border-top:1px solid #eee">
    <p style="margin:0;font-size:11px;color:#999">© ${new Date().getFullYear()} Waves &amp; Wires. All rights reserved.</p>
  </div>
</div></body></html>`;

export function orderConfirmHtml(p: {
  name: string; orderNum: string; items: any[];
  subtotal: number; discount: number; shipping: number;
  tax: number; total: number; paymentMethod: string;
}) {
  const rows = p.items.map(i =>
    `<tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:8px 0;font-size:13px">${i.product.name}</td>
      <td style="padding:8px 0;font-size:13px;text-align:center">×${i.quantity}</td>
      <td style="padding:8px 0;font-size:13px;text-align:right;font-weight:600">₹${(i.product.price*i.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('');
  return wrap(`<div style="padding:28px">
    <h2 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#111">Order Confirmed! 🎉</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#666">Hi ${p.name}, your order has been placed successfully.</p>
    <div style="background:#f8f8f8;border-radius:10px;padding:14px 18px;margin-bottom:20px">
      <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Order Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111">${p.orderNum}</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="border-bottom:2px solid #f0f0f0">
        <th style="padding:6px 0;font-size:11px;color:#999;text-align:left;font-weight:600">Item</th>
        <th style="padding:6px 0;font-size:11px;color:#999;text-align:center;font-weight:600">Qty</th>
        <th style="padding:6px 0;font-size:11px;color:#999;text-align:right;font-weight:600">Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="border-top:1px solid #f0f0f0;margin-top:12px;padding-top:12px">
      ${p.discount>0?`<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;color:#16a34a">Discount</span><span style="font-size:12px;color:#16a34a">−₹${p.discount.toLocaleString('en-IN')}</span></div>`:''}
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;color:#666">Shipping</span><span style="font-size:12px;color:#111">${p.shipping===0?'Free':'₹'+p.shipping}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;color:#666">GST (18%)</span><span style="font-size:12px;color:#111">₹${p.tax.toLocaleString('en-IN')}</span></div>
      <div style="display:flex;justify-content:space-between;border-top:2px solid #111;padding-top:10px">
        <span style="font-size:15px;font-weight:800;color:#111">Total</span>
        <span style="font-size:17px;font-weight:900;color:#111">₹${p.total.toLocaleString('en-IN')}</span>
      </div>
    </div>
    <div style="background:#fff8e1;border:1px solid #f5c018;border-radius:8px;padding:12px 16px;margin-top:20px">
      <p style="margin:0;font-size:12px;color:#92400e"><strong>Payment:</strong> ${p.paymentMethod==='cod'?'Cash on Delivery — Pay when your order arrives':'Paid Online via Razorpay ✓'}</p>
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#666;text-align:center">
      Track your order at <a href="${typeof window!=='undefined'?window.location.origin:''}/order-tracking" style="color:#f5c018;font-weight:700">Order Tracking</a>
    </p>
  </div>`);
}

export function cancelEmailHtml(name: string, orderNum: string, total: number, reason: string, isOnlinePayment: boolean) {
  return wrap(`<div style="padding:28px">
    <h2 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#111">Order Cancelled</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#666">Hi ${name}, your order has been cancelled as requested.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:16px">
      <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Order Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111">${orderNum}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#666">Amount: <strong>₹${total.toLocaleString('en-IN')}</strong></p>
      <p style="margin:4px 0 0;font-size:12px;color:#666">Reason: ${reason}</p>
    </div>
    ${isOnlinePayment
      ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:16px">
          <p style="margin:0;font-size:13px;color:#1d4ed8;font-weight:700">💳 Refund Processing</p>
          <p style="margin:6px 0 0;font-size:12px;color:#1e40af">Your refund of <strong>₹${total.toLocaleString('en-IN')}</strong> has been initiated and will reach your account within <strong>5–7 business days</strong>.</p>
        </div>`
      : `<p style="font-size:13px;color:#666;margin-bottom:16px">No payment was collected for this order.</p>`
    }
    <p style="margin:0;font-size:12px;color:#666;text-align:center">Need help? <a href="${typeof window!=='undefined'?window.location.origin:''}/contact" style="color:#f5c018;font-weight:700">Contact Us</a></p>
  </div>`);
}

export function refundRequestHtml(name: string, orderNum: string, total: number) {
  return wrap(`<div style="padding:28px">
    <h2 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#111">Refund Request Received</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#666">Hi ${name}, we've received your refund request.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:16px">
      <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Order Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111">${orderNum}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#666">Amount: <strong>₹${total.toLocaleString('en-IN')}</strong></p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:16px">
      <p style="margin:0;font-size:13px;color:#15803d;font-weight:700">What happens next?</p>
      <p style="margin:6px 0 0;font-size:12px;color:#166534">Our team will review your request within <strong>2–3 business days</strong>. Once approved, the refund will be processed within <strong>5–7 business days</strong> to your original payment method.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#666;text-align:center">Questions? <a href="${typeof window!=='undefined'?window.location.origin:''}/contact" style="color:#f5c018;font-weight:700">Contact Us</a></p>
  </div>`);
}

export function welcomeEmailHtml(name: string) {
  return wrap(`<div style="padding:28px;text-align:center">
    <div style="font-size:48px;margin-bottom:16px">🎉</div>
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#111">Welcome, ${name}!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#666">Your account is ready. Start exploring premium appliances at great prices.</p>
    <a href="${typeof window!=='undefined'?window.location.origin:''}/shop" style="display:inline-block;background:#f5c018;color:#000;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:900;text-decoration:none">Start Shopping →</a>
    <p style="margin:20px 0 0;font-size:12px;color:#999">Free shipping on orders above ₹999 🚚</p>
  </div>`);
}

export function contactAdminHtml(name: string, email: string, subject: string, message: string) {
  return wrap(`<div style="padding:28px">
    <h2 style="margin:0 0 20px;font-size:18px;font-weight:800;color:#111">New Contact Message</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:8px 0;font-size:13px;color:#666;width:70px;vertical-align:top">From</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#111">${name}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#666;vertical-align:top">Email</td><td style="padding:8px 0;font-size:13px"><a href="mailto:${email}" style="color:#f5c018">${email}</a></td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#666;vertical-align:top">Subject</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#111">${subject}</td></tr>
    </table>
    <div style="background:#f8f8f8;border-left:3px solid #f5c018;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px">
      <p style="margin:0;font-size:13px;color:#333;line-height:1.6;white-space:pre-wrap">${message}</p>
    </div>
    <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">Reply to ${name}</a>
  </div>`);
}