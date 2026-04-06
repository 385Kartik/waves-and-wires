// api/sms-otp.js
// CellX (smsgw.in) se OTP bhejta hai — 2Factor replace
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL            || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_ORIGINS = [
  process.env.SITE_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

// CellX credentials
const CELLX_USERNAME    = 'Numberwale03';
const CELLX_PASSWORD    = process.env.CELLX_PASSWORD;   // .env mein daalo
const CELLX_SENDER_ID   = 'WWIRES';
const CELLX_PE_ID       = '1705168743850569290';
const CELLX_TEMPLATE_ID = '1707177547575914691';

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

// 6 digit random OTP generate karo
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { action, phone, otp: inputOtp, user_id } = req.body ?? {};
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const formatted = normalisePhone(phone);

  // ── SEND OTP ─────────────────────────────────────────────────────────────
  if (action === 'send') {
    // Rate limiting: 60 second cooldown
    const { data: recentOtp } = await supabase
      .from('phone_otps')
      .select('created_at')
      .eq('phone', formatted)
      .eq('used', false)
      .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .maybeSingle();

    if (recentOtp) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting a new OTP.' });
    }

    try {
      // Purane OTPs mark as used
      await supabase
        .from('phone_otps')
        .update({ used: true })
        .eq('phone', formatted)
        .eq('used', false);

      // OTP generate karo
      const otp = generateOtp();

      // CellX ko SMS bhejo
      const messageText = encodeURIComponent(
        `Your OTP for Waves & Wires is ${otp}. Valid for 10 minutes. Do not share with anyone. - WWIRES`
      );

      // Phone number without + for CellX (91XXXXXXXXXX format)
      const toNumber = formatted.replace('+', '');

      const url = `https://web.smsgw.in/smsapi/httpapi.jsp?username=${CELLX_USERNAME}&password=${CELLX_PASSWORD}&from=${CELLX_SENDER_ID}&to=${toNumber}&text=${messageText}&pe_id=${CELLX_PE_ID}&template_id=${CELLX_TEMPLATE_ID}&coding=0`;

      const r    = await fetch(url);
      const text = await r.text();

      // CellX error check (XML response aata hai)
      if (text.includes('<Error>') || text.includes('ErrorCode')) {
        console.error('[CellX Send Error]', text);
        throw new Error('SMS sending failed. Please try again.');
      }

      // OTP DB mein save karo
      const { error: insertErr } = await supabase.from('phone_otps').insert({
        phone:      formatted,
        otp:        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      if (insertErr) throw insertErr;

      console.log(`[SMS OTP] Sent to ${formatted} via CellX`);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[SMS OTP Send Error]', err.message);
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
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchErr || !record) {
        return res.status(400).json({ error: 'OTP expired. Request a new one.' });
      }

      // OTP match karo (DB mein stored OTP se compare)
      if (record.otp !== inputOtp.trim()) {
        return res.status(400).json({ error: 'Invalid OTP. Try again.' });
      }

      // OTP use hua mark karo
      await supabase.from('phone_otps').update({ used: true }).eq('id', record.id);

      // Profile by phone dhundo
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formatted)
        .maybeSingle();

      // Agar alag user ka phone hai toh block
      if (profile?.id && user_id && profile.id !== user_id) {
        return res.status(400).json({ error: 'This phone number is already linked to another account.' });
      }

      const targetUserId = profile?.id ?? user_id;

      if (targetUserId) {
        await supabase.auth.admin.updateUserById(targetUserId, { email_confirm: true });
        await supabase
          .from('profiles')
          .update({ phone_verified: true, phone: formatted })
          .eq('id', targetUserId);
        console.log(`[SMS OTP] phone_verified=true for user ${targetUserId}`);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use "send" or "verify".' });
}