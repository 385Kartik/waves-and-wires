// api/whatsapp-otp.js
// ─────────────────────────────────────────────────────────────────────────────
// Galla Box WhatsApp se OTP bhejne aur verify karne ka backend endpoint.
// Supabase ka Twilio SMS bilkul use nahi hoga.
//
// ENV variables required (.env mein daalo):
//   GALLABOX_API_KEY        — Galla Box dashboard → Settings → API Keys
//   GALLABOX_API_SECRET     — Same page
//   GALLABOX_CHANNEL_ID     — Channel ID (WhatsApp Business number ka)
//   GALLABOX_OTP_TEMPLATE   — Template name jo WhatsApp ne approve kiya ho
//                             e.g. "waves_wires_otp"
//   SUPABASE_URL            — Already hai
//   SUPABASE_SERVICE_ROLE_KEY — Already hai
//
// Template format (WhatsApp Business approve karna padega):
//   "Your Waves & Wires verification code is {{1}}. Valid for 10 minutes."
//   Body variable: otp (ya {{1}})
//
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL            || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Phone normaliser ─────────────────────────────────────────────────────────
function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

// ── Generate 6-digit OTP ─────────────────────────────────────────────────────
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Send WhatsApp message via Galla Box ──────────────────────────────────────
async function sendGallaBoxOtp(phone, otp) {
  const apiKey      = process.env.GALLABOX_API_KEY;
  const apiSecret   = process.env.GALLABOX_API_SECRET;
  const channelId   = process.env.GALLABOX_CHANNEL_ID;
  const templateName = process.env.GALLABOX_OTP_TEMPLATE || 'waves_wires_otp';

  if (!apiKey || !apiSecret || !channelId) {
    throw new Error('Galla Box credentials missing in environment variables');
  }

  // E.164 without '+' for Galla Box (919876543210 format)
  const phoneForGalla = phone.replace('+', '');

  const payload = {
    channelId,
    channelType: 'whatsapp',
    recipient: {
      name: 'Customer',
      phone: phoneForGalla,
    },
    whatsapp: {
      type: 'template',
      template: {
        templateName,
        // Body variable: {{1}} = OTP
        bodyValues: {
          '1': otp,
        },
        // Some Galla Box accounts use this format instead:
        // components: [
        //   { type: 'body', parameters: [{ type: 'text', text: otp }] }
        // ]
      },
    },
  };

  const res = await fetch('https://server.gallabox.com/devapi/messages/whatsapp', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey:         apiKey,
      apiSecret:      apiSecret,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[Galla Box Error]', data);
    throw new Error(data.message || data.error || 'Galla Box API failed');
  }
  return data;
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { action, phone, otp: inputOtp } = req.body ?? {};

  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const formatted = normalisePhone(phone);

  // ── SEND OTP ─────────────────────────────────────────────────────────────
  if (action === 'send') {
    try {
      const otp = generateOtp();

      // Purane unexpired OTPs expire karo
      await supabase
        .from('phone_otps')
        .update({ used: true })
        .eq('phone', formatted)
        .eq('used', false);

      // Naya OTP store karo
      const { error: insertErr } = await supabase
        .from('phone_otps')
        .insert({ phone: formatted, otp, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });

      if (insertErr) throw insertErr;

      // Galla Box se bhejo
      await sendGallaBoxOtp(formatted, otp);

      console.log(`[OTP] Sent to ${formatted}`);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[OTP Send Error]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── VERIFY OTP ───────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!inputOtp) return res.status(400).json({ error: 'OTP required' });

    try {
      const { data: record, error: fetchErr } = await supabase
        .from('phone_otps')
        .select('*')
        .eq('phone', formatted)
        .eq('otp', inputOtp.trim())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchErr || !record) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // OTP mark as used
      await supabase.from('phone_otps').update({ used: true }).eq('id', record.id);

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use "send" or "verify".' });
}