// 2Factor session_id phone_otps table mein store hota hai (otp column mein)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL            || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

function phoneFor2Factor(formatted) {
  return formatted.replace('+', '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { action, phone, otp: inputOtp } = req.body ?? {};
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const formatted = normalisePhone(phone);
  const apiKey    = process.env.TWOFACTOR_API_KEY;

  // ── SEND OTP ─────────────────────────────────────────────────────────────
  if (action === 'send') {
    try {
      await supabase
        .from('phone_otps')
        .update({ used: true })
        .eq('phone', formatted)
        .eq('used', false);

      const url  = `https://2factor.in/API/V1/${apiKey}/SMS/${phoneFor2Factor(formatted)}/AUTOGEN`;
      const r    = await fetch(url);
      const data = await r.json();

      if (data.Status !== 'Success') throw new Error(data.Details || '2Factor send failed');

      const { error: insertErr } = await supabase.from('phone_otps').insert({
        phone:      formatted,
        otp:        data.Details,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      if (insertErr) throw insertErr;

      console.log(`[SMS OTP] Sent to ${formatted}`);
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

      if (fetchErr || !record) return res.status(400).json({ error: 'OTP expired. Request a new one.' });

      const url  = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${record.otp}/${inputOtp.trim()}`;
      const r    = await fetch(url);
      const data = await r.json();

      if (data.Status !== 'Success' || data.Details !== 'OTP Matched') {
        return res.status(400).json({ error: 'Invalid OTP. Try again.' });
      }

      await supabase.from('phone_otps').update({ used: true }).eq('id', record.id);

      // ✅ Profile fetch → email_confirm + phone_verified set karo (signup + account page dono)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formatted)
        .maybeSingle();

      if (profile?.id) {
        await supabase.auth.admin.updateUserById(profile.id, { email_confirm: true });
        await supabase.from('profiles').update({ phone_verified: true }).eq('id', profile.id);
        console.log(`[SMS OTP] phone_verified=true for user ${profile.id}`);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use "send" or "verify".' });
}