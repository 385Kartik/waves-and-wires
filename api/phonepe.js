// api/phonepe.js
// PhonePe Standard Checkout — initiate + verify + status

import crypto from 'crypto';

const PHONEPE_BASE = process.env.PHONEPE_ENV === 'prod'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

function makeXVerify(payload, endpoint, saltKey, saltIndex) {
  const hash = crypto.createHash('sha256').update(payload + endpoint + saltKey).digest('hex');
  return `${hash}###${saltIndex}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { action, payload } = req.body ?? {};

  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey    = process.env.PHONEPE_SALT_KEY;
  const saltIndex  = process.env.PHONEPE_SALT_INDEX || '1';
  const siteUrl    = process.env.SITE_URL || 'https://waves-and-wires.vercel.app/';

  // ── INITIATE PAYMENT ─────────────────────────────────────────────────────
  if (action === 'initiate') {
    const { amount, orderNumber, phone } = payload;
    if (!amount || !orderNumber) return res.status(400).json({ error: 'amount and orderNumber required' });

    const data = {
      merchantId,
      merchantTransactionId: orderNumber,           // order number = transaction ID
      merchantUserId:        `WW_${orderNumber}`,
      amount:                Math.round(amount * 100), // paise
      redirectUrl:           `${siteUrl}/payment-callback`,
      redirectMode:          'REDIRECT',
      callbackUrl:           `${siteUrl}/api/phonepe-webhook`,
      mobileNumber:          phone ? phone.replace(/\D/g, '').slice(-10) : undefined,
      paymentInstrument:     { type: 'PAY_PAGE' },
    };

    const base64payload = Buffer.from(JSON.stringify(data)).toString('base64');
    const endpoint      = '/pg/v1/pay';
    const xVerify       = makeXVerify(base64payload, endpoint, saltKey, saltIndex);

    try {
      const r      = await fetch(`${PHONEPE_BASE}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify },
        body:    JSON.stringify({ request: base64payload }),
      });
      const result = await r.json();

      if (result.success) {
        return res.status(200).json({
          success:     true,
          redirectUrl: result.data?.instrumentResponse?.redirectInfo?.url,
          transactionId: orderNumber,
        });
      }
      return res.status(400).json({ success: false, error: result.message ?? 'PhonePe initiation failed' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── VERIFY PAYMENT ───────────────────────────────────────────────────────
  if (action === 'verify') {
    const { merchantTransactionId } = payload;
    if (!merchantTransactionId) return res.status(400).json({ error: 'merchantTransactionId required' });

    const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const xVerify  = makeXVerify(endpoint, '', saltKey, saltIndex);
    // Note: status check X-VERIFY = sha256(endpoint + saltKey)###saltIndex (no base64)

    try {
      const r      = await fetch(`${PHONEPE_BASE}${endpoint}`, {
        headers: {
          'X-VERIFY':     xVerify,
          'X-MERCHANT-ID': merchantId,
          'Content-Type': 'application/json',
        },
      });
      const result = await r.json();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}