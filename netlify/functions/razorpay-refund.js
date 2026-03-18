const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { payment_id, amount } = JSON.parse(event.body || '{}');

    if (!payment_id || !amount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'payment_id and amount required' }) };
    }

    const key_id     = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Razorpay keys not configured' }) };
    }

    // Call Razorpay refund API
    const result = await new Promise((resolve, reject) => {
      const body = JSON.stringify({ amount: Math.round(amount * 100), speed: 'normal' });
      const auth = Buffer.from(`${key_id}:${key_secret}`).toString('base64');

      const req = https.request({
        hostname: 'api.razorpay.com',
        path:     `/v1/payments/${payment_id}/refund`,
        method:   'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type':  'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (result.status === 200 || result.status === 201) {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, refund_id: result.body.id }),
      };
    } else {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ success: false, error: result.body.error?.description ?? 'Refund failed' }),
      };
    }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
