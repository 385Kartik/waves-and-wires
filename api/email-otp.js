import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function otpEmailHtml(otp, email) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#111;">Verify your email</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Use the code below to verify <strong>${email}</strong> on Waves & Wires.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;letter-spacing:0.3em;font-size:32px;font-weight:700;color:#111;margin-bottom:24px;">${otp}</div>
      <p style="margin:0;color:#9ca3af;font-size:12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { action, user_id, email, otp: inputOtp } = req.body ?? {};
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  // ── SEND OTP ─────────────────────────────────────────────────────────────
  if (action === 'send') {
    if (!email) return res.status(400).json({ error: 'email required' });

    // Purane OTPs expire karo
    await supabase
      .from('email_verifications')
      .update({ used: true })
      .eq('user_id', user_id)
      .eq('used', false);

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const { error: insertErr } = await supabase.from('email_verifications').insert({
      user_id,
      email,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (insertErr) return res.status(500).json({ error: insertErr.message });

    try {
      await transporter.sendMail({
        from:    `"Waves & Wires" <${process.env.SMTP_USER}>`,
        to:      email,
        subject: 'Your verification code - Waves & Wires',
        html:    otpEmailHtml(otp, email),
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to send email: ' + err.message });
    }

    return res.status(200).json({ success: true });
  }

  // ── VERIFY OTP ───────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!inputOtp) return res.status(400).json({ error: 'OTP required' });

    const { data: record, error: fetchErr } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('user_id', user_id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchErr || !record) {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }
    if (record.otp !== inputOtp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Try again.' });
    }

    await supabase.from('email_verifications').update({ used: true }).eq('id', record.id);

    // Profile mein email + email_verified update karo
    await supabase.from('profiles').update({
      email:          record.email,
      email_verified: true,
    }).eq('id', user_id);

    return res.status(200).json({ success: true, email: record.email });
  }

  return res.status(400).json({ error: 'Invalid action. Use "send" or "verify".' });
}