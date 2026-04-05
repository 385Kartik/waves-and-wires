// api/phonepe.js
// PhonePe Standard Checkout — initiate + verify + status
// FIX: PAY_PAGE type use karo — yeh sab UPI apps se scan hone wala proper QR deta hai

import crypto from 'crypto';

const PHONEPE_BASE = process.env.PHONEPE_ENV === 'prod'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// ─── X-VERIFY Helper ────────────────────────────────────────────────────────
// Pay API:    sha256(base64Payload + "/pg/v1/pay"              + saltKey) ###idx
// Status API: sha256("/pg/v1/status/{mid}/{txnId}"             + saltKey) ###idx
function makeXVerify(data, saltKey, saltIndex) {
  const hash = crypto.createHash('sha256').update(data + saltKey).digest('hex');
  return `${hash}###${saltIndex}`;
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
  const siteUrl    = (process.env.SITE_URL || 'https://waves-and-wires.vercel.app').replace(/\/$/, '');

  if (!merchantId || !saltKey) {
    return res.status(500).json({ error: 'PhonePe credentials not configured' });
  }

  // ── INITIATE PAYMENT ────────────────────────────────────────────────────
  if (action === 'initiate') {
    const { amount, orderNumber, phone } = payload ?? {};
    if (!amount || !orderNumber) {
      return res.status(400).json({ error: 'amount and orderNumber required' });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : undefined;

    const data = {
      merchantId,
      merchantTransactionId: orderNumber,
      merchantUserId:        `WW_${orderNumber}`,
      amount:                Math.round(amount * 100), // paise mein
      redirectUrl:           `${siteUrl}/payment-callback`,
      redirectMode:          'POST',                         
      callbackUrl:           `${siteUrl}/api/phonepe-webhook`,
      ...(cleanPhone && { mobileNumber: cleanPhone }),
      paymentInstrument: {
        type: 'PAY_PAGE',             
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(data)).toString('base64');
    const endpoint      = '/pg/v1/pay';

    const xVerify = makeXVerify(base64Payload + endpoint, saltKey, saltIndex);

    try {
      const r = await fetch(`${PHONEPE_BASE}${endpoint}`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY':     xVerify,
        },
        body: JSON.stringify({ request: base64Payload }),
      });

      const result = await r.json();
      console.log('[PhonePe] Initiate response:', JSON.stringify(result));

      if (result.success) {
        const redirectUrl = result.data?.instrumentResponse?.redirectInfo?.url;
        if (!redirectUrl) {
          return res.status(500).json({ success: false, error: 'No redirect URL in PhonePe response' });
        }
        return res.status(200).json({
          success:       true,
          redirectUrl,
          transactionId: orderNumber,
        });
      }


      const errorMsg = PHONEPE_ERROR_CODES[result.code] ?? result.message ?? 'PhonePe initiation failed';
      return res.status(400).json({ success: false, error: errorMsg, code: result.code });

    } catch (err) {
      console.error('[PhonePe] Initiate exception:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── STATUS CHECK ─────────────────────────────────────────────────────────
  if (action === 'verify') {
    const { merchantTransactionId } = payload ?? {};
    if (!merchantTransactionId) {
      return res.status(400).json({ error: 'merchantTransactionId required' });
    }

    const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;

    const xVerify = makeXVerify(endpoint, saltKey, saltIndex);

    try {
      const r = await fetch(`${PHONEPE_BASE}${endpoint}`, {
        method:  'GET',
        headers: {
          'Content-Type':  'application/json',
          'X-VERIFY':      xVerify,
          'X-MERCHANT-ID': merchantId,
        },
      });

      const result = await r.json();
      console.log('[PhonePe] Status response:', JSON.stringify(result));
      return res.status(200).json(result);

    } catch (err) {
      console.error('[PhonePe] Status exception:', err);
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