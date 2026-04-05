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
  phone_verified:  boolean;  // profiles.phone_verified (WhatsApp OTP ke baad true)
  is_phone_signup: boolean;  // phone-first signup tha (internal email use hua)
  is_admin: boolean; created_at: string;
}

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUpWithEmail:         (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPhone:         (phone: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail:         (email: string, password: string) => Promise<boolean>;
  signInWithPhone:         (phone: string, password: string) => Promise<boolean>;
  signOut:                 () => Promise<void>;
  resetPassword:           (email: string) => Promise<boolean>;
  updateProfile:           (data: { full_name?: string; phone?: string }) => Promise<boolean>;
  addEmailToAccount:       (email: string) => Promise<boolean>;
  addPhoneToAccount:       (phone: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  sendWhatsAppOtp:         (phone: string) => Promise<boolean>;
  verifyWhatsAppOtp:       (phone: string, otp: string) => Promise<boolean>;
  refreshUser:             () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Phone helpers ───────────────────────────────────────────────────────────
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

// Phone-first signup ka internal hidden email (user kabhi nahi dekhega)
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

    const authEmail  = sess.user.email ?? '';
    const isPhone    = isInternalEmail(authEmail);

    setUser({
      id:              sess.user.id,
      // Phone signup users ke liye real email profile se aata hai, internal email nahi dikhega
      email:           isPhone ? (profile?.email ?? '') : authEmail,
      full_name:       profile?.full_name ?? sess.user.user_metadata?.full_name ?? '',
      phone:           profile?.phone ?? undefined,
      avatar_url:      profile?.avatar_url ?? undefined,
      email_verified:  isPhone
                         ? Boolean(profile?.email && profile?.email_verified)
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

  // ─── signUpWithEmail ──────────────────────────────────────────────────────
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

  // ─── signUpWithPhone ──────────────────────────────────────────────────────
  // Supabase phone auth nahi — internal email + password se account banao.
  // WhatsApp OTP se phone verify hoti hai alag se.
  async function signUpWithPhone(phone: string, password: string, fullName: string) {
    const formatted     = normalisePhone(phone);
    const internalEmail = phoneToInternalEmail(formatted);

    // Check: kya phone pehle se registered hai
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('phone', formatted).single();
    if (existing) return { success: false, error: 'phone_exists' };

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail, password,
      options: { data: { full_name: fullName, phone: formatted } },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists'))
        return { success: false, error: 'phone_exists' };
      return { success: false, error: error.message };
    }
    if (data.user && (!data.user.identities || data.user.identities.length === 0))
      return { success: false, error: 'phone_exists' };

    // Profile mein phone save karo (email null — baad mein add karenga)
    await supabase.from('profiles').upsert({
      id: data.user!.id, full_name: fullName,
      phone: formatted, email: null, phone_verified: false,
    }, { onConflict: 'id' });

    return { success: true };
  }

  // ─── signInWithEmail ──────────────────────────────────────────────────────
  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── signInWithPhone ──────────────────────────────────────────────────────
  // Phone se signup kiya tha → internal email reconstruct → login
  async function signInWithPhone(phone: string, password: string) {
    const formatted     = normalisePhone(phone);
    const internalEmail = phoneToInternalEmail(formatted);
    const { error } = await supabase.auth.signInWithPassword({ email: internalEmail, password });
    if (error) {
      toast.error('Incorrect phone number or password');
      return false;
    }
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

  // ─── addEmailToAccount ────────────────────────────────────────────────────
  // Phone-signup user real email add kar raha hai.
  // Profile mein save karo immediately, Supabase auth ko bhi update karo (confirmation email jayegi).
  async function addEmailToAccount(email: string): Promise<boolean> {
    if (!user) return false;
    const cleanEmail = email.trim().toLowerCase();

    // Pehle profiles mein save karo (taaki reload pe gayab na ho)
    await supabase.from('profiles')
      .update({ email: cleanEmail, email_verified: false })
      .eq('id', user.id);

    // Supabase auth mein update karo (confirmation email trigger hogi)
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    if (error) {
      toast.error(error.message);
      return false;
    }

    setUser(prev => prev ? { ...prev, email: cleanEmail, email_verified: false } : prev);
    return true;
  }

  // ─── addPhoneToAccount ────────────────────────────────────────────────────
  // Email-signup user phone add kar raha hai (profiles mein save, verify baad mein)
  async function addPhoneToAccount(phone: string): Promise<boolean> {
    if (!user) return false;
    const formatted = normalisePhone(phone);
    const { error } = await supabase.from('profiles')
      .update({ phone: formatted, phone_verified: false })
      .eq('id', user.id);
    if (error) { toast.error(error.message); return false; }
    setUser(prev => prev ? { ...prev, phone: formatted, phone_verified: false } : prev);
    return true;
  }

  // ─── resendVerificationEmail ──────────────────────────────────────────────
  async function resendVerificationEmail(): Promise<boolean> {
    if (!user || !session) return false;
    if (user.is_phone_signup && user.email) {
      // Phone-signup user ke liye email change resend
      const { error } = await supabase.auth.resend({ type: 'email_change', email: user.email });
      if (error) { toast.error(error.message); return false; }
    } else {
      const { error } = await supabase.auth.resend({
        type: 'signup', email: session.user.email!,
        options: { emailRedirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?verified=true` },
      });
      if (error) { toast.error(error.message); return false; }
    }
    toast.success('Verification email sent!');
    return true;
  }

  // ─── WhatsApp OTP via Galla Box is changed to sms, but because i have to change everything in function, i changed the api endpoint. Same with verifucation ───────────────────────────────────────────
  async function sendWhatsAppOtp(phone: string): Promise<boolean> {
  const formatted = normalisePhone(phone);
  try {
    const res = await fetch('/api/sms-otp', {  
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', phone: formatted }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) { toast.error(data.error || 'Could not send OTP'); return false; }
    toast.success('OTP sent via SMS!');  
    return true;
  } catch { toast.error('OTP service unavailable'); return false; }
}

  async function verifyWhatsAppOtp(phone: string, otp: string): Promise<boolean> {
  const formatted = normalisePhone(phone);
  try {
    const res = await fetch('/api/sms-otp', {   // ← whatsapp-otp → sms-otp
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', phone: formatted, otp: otp.trim() }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) { toast.error(data.error || 'Invalid OTP'); return false; }
    if (user) {
      await supabase.from('profiles')
        .update({ phone: formatted, phone_verified: true })
        .eq('id', user.id);
      setUser(prev => prev ? { ...prev, phone: formatted, phone_verified: true } : prev);
    }
    toast.success('Phone verified! ✓');
    return true;
  } catch { toast.error('Verification failed'); return false; }
}

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAdmin: user?.is_admin ?? false,
      signUpWithEmail, signUpWithPhone,
      signInWithEmail, signInWithPhone,
      signOut, resetPassword, updateProfile,
      addEmailToAccount, addPhoneToAccount,
      resendVerificationEmail, sendWhatsAppOtp, verifyWhatsAppOtp, refreshUser,
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