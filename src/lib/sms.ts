// src/lib/sms.ts
// Fire-and-forget SMS sender via /api/send-sms (CellX backend)

export async function sendSms(
  to: string,
  type: 'order_confirm' | 'order_delivered',
  params: { orderNum: string; total: number; name?: string }
): Promise<void> {
  try {
    await fetch('/api/send-sms', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to, type, ...params }),
    });
  } catch (err) {
    console.error('[sendSms]', err);
  }
}