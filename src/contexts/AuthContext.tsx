import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string; email: string; full_name: string;
  phone?: string; avatar_url?: string;
  email_verified: boolean; is_admin: boolean; created_at: string;
}

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUp:         (email: string, password: string, fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  signIn:         (email: string, password: string) => Promise<boolean>;
  signOut:        () => Promise<void>;
  resetPassword:  (email: string) => Promise<boolean>;
  updateProfile:  (data: { full_name?: string; phone?: string }) => Promise<boolean>;
  addEmail:       (email: string) => Promise<boolean>; // for phone-OTP-signup users
  sendPhoneOtp:   (phone: string) => Promise<boolean>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<boolean>;
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
      is_admin:       profile?.is_admin ?? false,
      created_at:     sess.user.created_at,
    });
    setLoading(false);
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

  // ─── signUp ──────────────────────────────────────────────────────────────
  // phone is now REQUIRED — passed as user_metadata so the DB trigger saves it
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

    // Fire-and-forget welcome email
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

  // ─── addEmail (for phone-OTP-signup users) ────────────────────────────────
  // Calls supabase.auth.updateUser which fires a verification email.
  // User must verify email before placing orders (email_verified check in checkout).
  async function addEmail(email: string): Promise<boolean> {
    if (!user) return false;
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    if (error) { toast.error(error.message); return false; }
    // Mirror to profile for quick reads
    await supabase.from('profiles').update({ email: cleanEmail }).eq('id', user.id);
    setUser(prev => prev ? { ...prev, email: cleanEmail } : prev);
    return true;
  }

  // ─── Phone OTP: send ──────────────────────────────────────────────────────
  async function sendPhoneOtp(phone: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
      options: { shouldCreateUser: true },
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  // ─── Phone OTP: verify ────────────────────────────────────────────────────
  async function verifyPhoneOtp(phone: string, token: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted, token: token.trim(), type: 'sms',
    });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  return (
    <AuthContext.Provider value={{
      user, session, isLoading,
      isAdmin: user?.is_admin ?? false,
      signUp, signIn, signOut, resetPassword, updateProfile,
      addEmail, sendPhoneOtp, verifyPhoneOtp,
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