export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing to or message' });
  }

  // Twilio ko number E.164 format mein chahiye (+91...)
  const digits = to.replace(/\D/g, '');
  const phone = digits.startsWith('91') && digits.length === 12
    ? `+${digits}`
    : digits.length === 10
      ? `+91${digits}`
      : `+${digits}`;

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER; // Aapka +1 wala Twilio number

    if (!accountSid || !authToken || !twilioNumber) {
      return res.status(500).json({ error: 'Twilio credentials missing in .env' });
    }

    // Twilio API ke liye data prepare karna
    const params = new URLSearchParams({
      To: phone,
      From: twilioNumber,
      Body: message
    });

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // Twilio REST API ko call karna
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Twilio Error]:', data);
      return res.status(500).json({ error: data.message || 'Twilio SMS failed' });
    }

    return res.status(200).json({ success: true, sid: data.sid });
  } catch (err) {
    console.error('[send-sms] Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}