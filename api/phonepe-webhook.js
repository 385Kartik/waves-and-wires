// api/phonepe-webhook.js
// PhonePe server-to-server webhook — confirms/fails orders without user redirect
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifyWebhookSignature(rawBody, xVerifyHeader, saltKey) {
  if (!xVerifyHeader) return false;
  const [receivedHash, saltIndexStr] = xVerifyHeader.split('###');
  const computedHash = crypto.createHash('sha256').update(rawBody + saltKey).digest('hex');
  return receivedHash === computedHash;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const saltKey  = process.env.PHONEPE_SALT_KEY;
    const rawBody  = JSON.stringify(req.body);
    const xVerify  = req.headers['x-verify'];

    // Verify webhook authenticity
    if (saltKey && xVerify && !verifyWebhookSignature(rawBody, xVerify, saltKey)) {
      console.warn('[PhonePe Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { response } = req.body ?? {};
    if (!response) return res.status(200).json({ status: 'ok' });

    // Decode base64 payload
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf8'));
    } catch {
      console.warn('[PhonePe Webhook] Could not decode response');
      return res.status(200).json({ status: 'ok' });
    }

    const state = decoded?.data?.state ?? decoded?.code;
    const txnId = decoded?.data?.merchantTransactionId ?? '';
    console.log('[PhonePe Webhook] state:', state, 'txn:', txnId);

    if (!txnId) return res.status(200).json({ status: 'ok' });

    // Extract orderNumber from txnId format: "WW-XXXXXXX-timestamp"
    const orderNumber = txnId.split('-').slice(0, 2).join('-');
    if (!orderNumber) return res.status(200).json({ status: 'ok' });

    if (state === 'COMPLETED' || decoded?.code === 'PAYMENT_SUCCESS') {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_ref:    txnId,
          status:         'confirmed',
          updated_at:     new Date().toISOString(),
        })
        .eq('order_number', orderNumber)
        .in('payment_status', ['pending']); // Only update if still pending

      if (error) console.error('[PhonePe Webhook] DB update error:', error.message);
      else console.log('[PhonePe Webhook] Order confirmed:', orderNumber);
    }

    if (state === 'FAILED' || decoded?.code === 'PAYMENT_ERROR') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status:         'cancelled',
          updated_at:     new Date().toISOString(),
        })
        .eq('order_number', orderNumber)
        .in('payment_status', ['pending']);
    }

    // Always return 200 to PhonePe — they retry if they get non-200
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[PhonePe Webhook Error]', err.message);
    return res.status(200).json({ error: err.message });
  }
}