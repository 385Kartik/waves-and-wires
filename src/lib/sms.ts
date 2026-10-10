// src/lib/sms.ts
// Fire-and-forget SMS sender via /api/send-sms (CellX backend with exact DLT templates)

export async function sendSms(
  to: string,
  type: 'order_confirm' | 'order_placed' | 'order_delivered',
  params: { orderNum?: string; orderNumber?: string; total: number; name?: string }
): Promise<void> {
  try {
    const orderNum = params.orderNum || params.orderNumber || '';
    await fetch('/api/send-sms', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        to,
        type: type === 'order_placed' ? 'order_confirm' : type,
        orderNum,
        total: params.total,
        name: params.name,
      }),
    });
  } catch (err) {
    console.error('[sendSms]', err);
  }
}