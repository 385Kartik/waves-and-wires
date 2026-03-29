// ─── SMS Utility ──────────────────────────────────────────────────────────────
// Fire-and-forget SMS sender. Calls your backend /api/send-sms endpoint.
// See api/send-sms.js for the backend implementation (MSG91 / Fast2SMS / Twilio).

export async function sendSms(to: string, message: string): Promise<void> {
  try {
    await fetch('/api/send-sms', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to, message }),
    });
  } catch (err) {
    console.error('[sendSms]', err);
  }
}

// ─── SMS Templates ────────────────────────────────────────────────────────────

const SITE_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : '') || 'https://wavesandwires.in';

/** Sent when an order is placed. */
export function orderConfirmSms(orderNum: string, total: number, name: string): string {
  return (
    `Hi ${name.split(' ')[0]}! Your Waves & Wires order #${orderNum} ` +
    `(₹${total.toLocaleString('en-IN')}) is confirmed. ` +
    `Track: ${SITE_URL}/order-tracking?order=${orderNum} ` +
    `Questions? support@wavesandwires.in`
  );
}

/** Sent when an order is dispatched / shipped. */
export function orderDispatchedSms(orderNum: string, name: string): string {
  return (
    `Hi ${name.split(' ')[0]}! Your order #${orderNum} has been dispatched. ` +
    `Track it here: ${SITE_URL}/order-tracking?order=${orderNum}`
  );
}

/** Sent when an order is delivered. */
export function orderDeliveredSms(orderNum: string, name: string): string {
  return (
    `Hi ${name.split(' ')[0]}! Your Waves & Wires order #${orderNum} has been delivered. ` +
    `Thank you for shopping with us! Need help? support@wavesandwires.in`
  );
}

/** Sent when an order is cancelled. */
export function orderCancelledSms(orderNum: string, total: number, name: string, isOnline: boolean): string {
  const refund = isOnline ? ` Refund of ₹${total.toLocaleString('en-IN')} will be processed in 5-7 days.` : '';
  return (
    `Hi ${name.split(' ')[0]}, your order #${orderNum} has been cancelled.${refund} ` +
    `Questions? Reply or email support@wavesandwires.in`
  );
}