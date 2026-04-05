// api/phonepe.js
import crypto from 'crypto';

const PHONEPE_BASE = process.env.PHONEPE_ENV === 'prod'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { action, payload } = req.body ?? {};
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey    = process.env.PHONEPE_SALT_KEY;
  const saltIndex  = process.env.PHONEPE_SALT_INDEX || '1';
  const siteUrl    = (process.env.SITE_URL || '').replace(/\/$/, '');

  // INITIATE
  if (action === 'initiate') {
    const { amount, orderNumber, phone } = payload ?? {};
    if (!amount || !orderNumber) return res.status(400).json({ error: 'amount and orderNumber required' });

    // FIX: har attempt ke liye unique ID — PhonePe ek ID sirf ek baar accept karta hai
    const merchantTransactionId = `${orderNumber}-${Date.now()}`;

    const data = {
      merchantId,
      merchantTransactionId,
      merchantUserId:    `WW_${orderNumber}`,
      amount:            Math.round(amount * 100),
      redirectUrl:       `${siteUrl}/payment-callback?order=${orderNumber}&txn=${merchantTransactionId}`,
      redirectMode:      'REDIRECT',
      callbackUrl:       `${siteUrl}/api/phonepe-webhook`,
      mobileNumber:      phone ? phone.replace(/\D/g, '').slice(-10) : undefined,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(data)).toString('base64');
    const endpoint      = '/pg/v1/pay';
    const xVerify       = `${sha256(base64Payload + endpoint + saltKey)}###${saltIndex}`;

    try {
      const r      = await fetch(`${PHONEPE_BASE}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify },
        body:    JSON.stringify({ request: base64Payload }),
      });
      const result = await r.json();
      console.log('[PhonePe] Initiate:', result.code, result.message);

      if (result.success) {
        return res.status(200).json({
          success:       true,
          redirectUrl:   result.data?.instrumentResponse?.redirectInfo?.url,
          transactionId: merchantTransactionId,
          orderNumber,
        });
      }
      return res.status(400).json({ success: false, error: result.message ?? 'PhonePe initiation failed', code: result.code });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // STATUS CHECK
  if (action === 'verify') {
    const { merchantTransactionId } = payload ?? {};
    if (!merchantTransactionId) return res.status(400).json({ error: 'merchantTransactionId required' });

    const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const xVerify  = `${sha256(endpoint + saltKey)}###${saltIndex}`;

    try {
      const r      = await fetch(`${PHONEPE_BASE}${endpoint}`, {
        method:  'GET',
        headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'X-MERCHANT-ID': merchantId },
      });
      const result = await r.json();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
// ── PhonePe Error Codes ───────────────────────────────────────────────────
const PHONEPE_ERROR_CODES = {
  PAYMENT_ERROR:              'Payment failed. Please try again.',
  PAYMENT_PENDING:            'Payment is pending. Please wait.',
  PAYMENT_DECLINED:           'Payment was declined by your bank.',
  TIMED_OUT:                  'Payment timed out. Please try again.',
  AUTHORIZATION_FAILED:       'Authorization failed. Check credentials.',
  INTERNAL_SERVER_ERROR:      'PhonePe server error. Try again later.',
  BAD_REQUEST:                'Invalid payment request.',
  TRANSACTION_NOT_FOUND:      'Transaction not found.',
  TRANSACTION_ALREADY_EXISTS: 'Duplicate transaction ID.',
};