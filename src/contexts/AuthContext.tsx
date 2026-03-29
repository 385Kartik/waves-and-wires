import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string; email: string; full_name: string;
  phone?: string; avatar_url?: string;
  email_verified: boolean;
  phone_verified: boolean; // ← NEW: tracks phone_confirmed_at in Supabase auth
  is_admin: boolean; created_at: string;
}

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUp:                  (email: string, password: string, fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  signIn:                  (email: string, password: string) => Promise<boolean>;
  signOut:                 () => Promise<void>;
  resetPassword:           (email: string) => Promise<boolean>;
  updateProfile:           (data: { full_name?: string; phone?: string }) => Promise<boolean>;
  addEmail:                (email: string, password?: string, fullName?: string) => Promise<boolean>;
  sendPhoneOtp:            (phone: string) => Promise<boolean>;   // login / signup SMS path
  verifyPhoneOtp:          (phone: string, token: string) => Promise<boolean>;
  // ── New methods ───────────────────────────────────────────────────────────
  refreshUser:             () => Promise<void>;                   // re-fetch session → update user state
  resendVerificationEmail: () => Promise<boolean>;                // resend email confirm link
  sendPhoneVerifyOtp:      (phone: string) => Promise<boolean>;   // account-page phone verification (updateUser)
  confirmPhoneVerifyOtp:   (phone: string, token: string) => Promise<boolean>; // verify OTP type='phone_change'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Phone normaliser (India E.164) ──────────────────────────────────────────
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]    = useState<AuthUser | null>(null);
  const [session,   setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);

  // ── Session → user mapper ────────────────────────────────────────────────
  async function handleSession(sess: Session | null) {
    if (!sess?.user) {
      setUser(null); setSession(null); setLoading(false); return;
    }
    setSession(sess);
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sess.user.id)
      .single();

    setUser({
      id:             sess.user.id,
      email:          sess.user.email ?? profile?.email ?? '',
      full_name:      profile?.full_name ?? sess.user.user_metadata?.full_name ?? '',
      phone:          profile?.phone ?? sess.user.phone ?? undefined,
      avatar_url:     profile?.avatar_url ?? undefined,
      email_verified: sess.user.email_confirmed_at != null,
      phone_verified: sess.user.phone_confirmed_at != null, // ← NEW
      is_admin:       profile?.is_admin ?? false,
      created_at:     sess.user.created_at,
    });
    setLoading(false);
  }

  // ── Re-fetch session and refresh user state (call after phone verify etc.) ─
  async function refreshUser() {
    const { data: { session: sess } } = await supabase.auth.getSession();
    await handleSession(sess);
  }

  // ── Auth state listener ──────────────────────────────────────────────────
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

  // ─── signUp (email-first path) ────────────────────────────────────────────
  // Called when user chooses "Verify via Email" on signup_choose screen.
  // Phone is stored in user_metadata (not yet verified in auth).
  async function signUp(email: string, password: string, fullName: string, phone: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          full_name: fullName,
          phone:     normalisePhone(phone),
        },
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

  // ─── signIn ──────────────────────────────────────────────────────────────
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── signOut ─────────────────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut({ scope: 'global' });
  }

  // ─── resetPassword ────────────────────────────────────────────────────────
  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?reset=true`,
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── updateProfile ────────────────────────────────────────────────────────
  async function updateProfile(data: { full_name?: string; phone?: string }) {
    if (!user) return false;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) { toast.error(error.message); return false; }
    setUser(prev => prev ? { ...prev, ...data } : prev);
    toast.success('Profile updated');
    return true;
  }

  // ─── addEmail ────────────────────────────────────────────────────────────
  // Used after SMS-OTP signup to attach email + password to phone account.
  // Also supports legacy phone-only → email collect flow.
  async function addEmail(email: string, password?: string, fullName?: string): Promise<boolean> {
    if (!user) return false;
    const cleanEmail = email.trim().toLowerCase();

    const updatePayload: Record<string, string> = { email: cleanEmail };
    if (password) updatePayload.password = password;
    if (fullName) updatePayload.data = JSON.stringify({ full_name: fullName }); // passed below properly

    const payload: Parameters<typeof supabase.auth.updateUser>[0] = { email: cleanEmail };
    if (password) payload.password = password;
    if (fullName) payload.data    = { full_name: fullName };

    const { error } = await supabase.auth.updateUser(payload);
    if (error) { toast.error(error.message); return false; }

    await supabase.from('profiles').update({
      email: cleanEmail,
      ...(fullName ? { full_name: fullName } : {}),
    }).eq('id', user.id);

    setUser(prev => prev ? {
      ...prev,
      email: cleanEmail,
      ...(fullName ? { full_name: fullName } : {}),
    } : prev);

    return true;
  }

  // ─── resendVerificationEmail ──────────────────────────────────────────────
  async function resendVerificationEmail(): Promise<boolean> {
    if (!user?.email) return false;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?verified=true`,
      },
    });
    if (error) { toast.error(error.message); return false; }
    toast.success('Verification email sent! Check your inbox.');
    return true;
  }

  // ─── Phone OTP: send (login or signup SMS path) ───────────────────────────
  async function sendPhoneOtp(phone: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
      options: { shouldCreateUser: true },
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── Phone OTP: verify (login or signup SMS path) ────────────────────────
  async function verifyPhoneOtp(phone: string, token: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted, token: token.trim(), type: 'sms',
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── Phone verification for existing account (Account Page) ──────────────
  // Calls updateUser({ phone }) which sends OTP via SMS.
  // This attaches the phone to the Supabase auth user (not just metadata).
  async function sendPhoneVerifyOtp(phone: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    const { error } = await supabase.auth.updateUser({ phone: formatted });
    if (error) { toast.error(error.message); return false; }
    // Also make sure phone is saved in profile
    if (user) {
      await supabase.from('profiles').update({ phone: formatted }).eq('id', user.id);
      setUser(prev => prev ? { ...prev, phone: formatted } : prev);
    }
    toast.success('OTP sent to your phone!');
    return true;
  }

  // ─── Confirm phone OTP for existing account (type: 'phone_change') ────────
  async function confirmPhoneVerifyOtp(phone: string, token: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted, token: token.trim(), type: 'phone_change',
    });
    if (error) { toast.error(error.message); return false; }
    await refreshUser(); // re-fetch to get updated phone_confirmed_at
    toast.success('Phone number verified! ✓');
    return true;
  }

  return (
    <AuthContext.Provider value={{
      user, session, isLoading,
      isAdmin: user?.is_admin ?? false,
      signUp, signIn, signOut, resetPassword, updateProfile,
      addEmail, sendPhoneOtp, verifyPhoneOtp,
      refreshUser, resendVerificationEmail, sendPhoneVerifyOtp, confirmPhoneVerifyOtp,
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