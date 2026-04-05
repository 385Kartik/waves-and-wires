import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast }    from 'sonner';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string; email: string; full_name: string;
  phone?: string; avatar_url?: string;
  email_verified:  boolean;
  phone_verified:  boolean;
  is_phone_signup: boolean;
  is_admin: boolean; created_at: string;
}

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUpWithEmail:    (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPhone:    (phone: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail:    (email: string, password: string) => Promise<boolean>;
  signInWithPhone:    (phone: string, password: string) => Promise<boolean>;
  signOut:            () => Promise<void>;
  resetPassword:      (email: string) => Promise<boolean>;
  updateProfile:      (data: { full_name?: string; phone?: string }) => Promise<boolean>;
  // Email OTP flow (custom — no Supabase email change)
  sendEmailOtp:       (email: string) => Promise<boolean>;
  verifyEmailOtp:     (otp: string) => Promise<boolean>;
  // SMS OTP flow
  sendSmsOtp:         (phone: string) => Promise<boolean>;
  verifySmsOtp:       (phone: string, otp: string) => Promise<boolean>;
  // Legacy aliases
  sendWhatsAppOtp:    (phone: string) => Promise<boolean>;
  verifyWhatsAppOtp:  (phone: string, otp: string) => Promise<boolean>;
  refreshUser:        () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Phone helpers ────────────────────────────────────────────────────────────
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export function phoneToInternalEmail(phone: string): string {
  const digits = normalisePhone(phone).replace('+', '');
  return `ph_${digits}@ww.internal`;
}

export function isInternalEmail(email: string): boolean {
  return email.endsWith('@ww.internal');
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]    = useState<AuthUser | null>(null);
  const [session,   setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);

  async function handleSession(sess: Session | null) {
    if (!sess?.user) { setUser(null); setSession(null); setLoading(false); return; }
    setSession(sess);

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', sess.user.id).single();

    const authEmail = sess.user.email ?? '';
    const isPhone   = isInternalEmail(authEmail);

    // Profile email — internal email kabhi show mat karo
    const profileEmail = profile?.email ?? '';
    const displayEmail = isPhone
      ? (isInternalEmail(profileEmail) ? '' : profileEmail)
      : authEmail;

    setUser({
      id:              sess.user.id,
      email:           displayEmail,
      full_name:       profile?.full_name ?? sess.user.user_metadata?.full_name ?? '',
      phone:           profile?.phone ?? undefined,
      avatar_url:      profile?.avatar_url ?? undefined,
      email_verified:  isPhone
                         ? Boolean(displayEmail && profile?.email_verified)
                         : sess.user.email_confirmed_at != null,
      phone_verified:  Boolean(profile?.phone_verified),
      is_phone_signup: isPhone,
      is_admin:        profile?.is_admin ?? false,
      created_at:      sess.user.created_at,
    });
    setLoading(false);
  }

  async function refreshUser() {
    const { data: { session: sess } } = await supabase.auth.getSession();
    await handleSession(sess);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || event === 'INITIAL_SESSION') return;
      handleSession(session);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ─── signUpWithEmail ───────────────────────────────────────────────────────
  async function signUpWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?verified=true`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists'))
        return { success: false, error: 'account_exists' };
      return { success: false, error: error.message };
    }
    if (data.user && (!data.user.identities || data.user.identities.length === 0))
      return { success: false, error: 'account_exists' };

    sendEmail(email, 'Welcome to Waves & Wires! 🎉', welcomeEmailHtml(fullName));
    return { success: true };
  }

  // ─── signUpWithPhone ───────────────────────────────────────────────────────
  // Internal email se account banao — signin OTP verify ke BAAD hoga
  async function signUpWithPhone(phone: string, password: string, fullName: string) {
    const formatted     = normalisePhone(phone);
    const internalEmail = phoneToInternalEmail(formatted);

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('phone', formatted).maybeSingle();
    if (existing) return { success: false, error: 'phone_exists' };

    const { data, error } = await supabase.auth.signUp({
      email:    internalEmail,
      password,
      options:  { data: { full_name: fullName, phone: formatted } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists'))
        return { success: false, error: 'phone_exists' };
      return { success: false, error: error.message };
    }
    if (data.user && (!data.user.identities || data.user.identities.length === 0))
      return { success: false, error: 'phone_exists' };

    return { success: true };
  }

  // ─── signInWithEmail ───────────────────────────────────────────────────────
  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── signInWithPhone ───────────────────────────────────────────────────────
  async function signInWithPhone(phone: string, password: string) {
    const formatted     = normalisePhone(phone);
    const internalEmail = phoneToInternalEmail(formatted);
    const { error }     = await supabase.auth.signInWithPassword({ email: internalEmail, password });
    if (error) { toast.error('Incorrect phone number or password'); return false; }
    return true;
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: 'global' });
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?reset=true`,
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  async function updateProfile(data: { full_name?: string; phone?: string }) {
    if (!user) return false;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) { toast.error(error.message); return false; }
    setUser(prev => prev ? { ...prev, ...data } : prev);
    toast.success('Profile updated');
    return true;
  }

  // ─── sendEmailOtp ─────────────────────────────────────────────────────────
  // Custom OTP email — supabase.auth.updateUser use NAHI karte (woh "Confirm Change of Email" bhejta hai)
  async function sendEmailOtp(email: string): Promise<boolean> {
    if (!user) return false;
    const cleanEmail = email.trim().toLowerCase();
    try {
      // Pehle profile mein email save karo (unverified)
      await supabase.from('profiles').update({ email: cleanEmail, email_verified: false }).eq('id', user.id);
      setUser(prev => prev ? { ...prev, email: cleanEmail, email_verified: false } : prev);

      const res  = await fetch('/api/email-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', user_id: user.id, email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not send OTP'); return false; }
      toast.success('OTP sent to ' + cleanEmail);
      return true;
    } catch { toast.error('Email OTP service unavailable'); return false; }
  }

  // ─── verifyEmailOtp ───────────────────────────────────────────────────────
  async function verifyEmailOtp(otp: string): Promise<boolean> {
    if (!user) return false;
    try {
      const res  = await fetch('/api/email-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', user_id: user.id, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error || 'Invalid OTP'); return false; }
      setUser(prev => prev ? { ...prev, email: data.email, email_verified: true } : prev);
      toast.success('Email verified! ✓');
      return true;
    } catch { toast.error('Verification failed'); return false; }
  }

  // ─── sendSmsOtp ───────────────────────────────────────────────────────────
  async function sendSmsOtp(phone: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    try {
      const res  = await fetch('/api/sms-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: formatted }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not send OTP'); return false; }
      toast.success('OTP sent!');
      return true;
    } catch { toast.error('OTP service unavailable'); return false; }
  }

  // ─── verifySmsOtp ─────────────────────────────────────────────────────────
  // Server side: phone_verified = true already set ho jaata hai (sms-otp.js)
  // Client side: user state update karo agar logged in hai
  async function verifySmsOtp(phone: string, otp: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    try {
      const res  = await fetch('/api/sms-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone: formatted, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error || 'Invalid OTP'); return false; }

      // Logged-in user ka state update karo
      if (user) {
        setUser(prev => prev ? { ...prev, phone: formatted, phone_verified: true } : prev);
      }
      toast.success('Phone verified! ✓');
      return true;
    } catch { toast.error('Verification failed'); return false; }
  }

  // Legacy aliases
  const sendWhatsAppOtp   = sendSmsOtp;
  const verifyWhatsAppOtp = verifySmsOtp;

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAdmin: user?.is_admin ?? false,
      signUpWithEmail, signUpWithPhone,
      signInWithEmail, signInWithPhone,
      signOut, resetPassword, updateProfile,
      sendEmailOtp, verifyEmailOtp,
      sendSmsOtp, verifySmsOtp,
      sendWhatsAppOtp, verifyWhatsAppOtp,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}