import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AuthUser {
  id: string; email: string; full_name: string;
  phone?: string; avatar_url?: string;
  email_verified: boolean; is_admin: boolean; created_at: string;
}

interface SignInResult { success: boolean; needsVerification: boolean; }

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUp:        (email: string, password: string, fullName: string) => Promise<{ success: boolean; userId?: string; error?: string }>;
  signIn:        (email: string, password: string) => Promise<SignInResult>;
  signOut:       () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: { full_name?: string; phone?: string }) => Promise<boolean>;
  sendOtp:       (userId: string, userEmail: string, userName: string) => Promise<boolean>;
  verifyOtp:     (userId: string, otp: string) => Promise<boolean>;
  refreshUser:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]    = useState<AuthUser | null>(null);
  const [session,   setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);

  async function handleSession(sess: Session | null) {
    if (!sess?.user) { setUser(null); setSession(null); setLoading(false); return; }
    setSession(sess);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', sess.user.id).single();
    setUser({
      id: sess.user.id, email: sess.user.email ?? '',
      full_name:      profile?.full_name ?? sess.user.user_metadata?.full_name ?? '',
      phone:          profile?.phone ?? undefined,
      avatar_url:     profile?.avatar_url ?? undefined,
      email_verified: profile?.email_verified ?? false,
      is_admin:       profile?.is_admin ?? false,
      created_at:     sess.user.created_at,
    });
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => { if (mounted) handleSession(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || event === 'INITIAL_SESSION') return;
      handleSession(session);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function refreshUser() {
    const { data: { session } } = await supabase.auth.getSession();
    await handleSession(session);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists'))
        return { success: false, error: 'account_exists' };
      return { success: false, error: error.message };
    }
    if (data.user && (!data.user.identities || data.user.identities.length === 0))
      return { success: false, error: 'account_exists' };
    return { success: true, userId: data.user?.id };
  }

  async function signIn(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return { success: false, needsVerification: false }; }
    const { data: profile } = await supabase.from('profiles').select('email_verified').eq('id', data.user.id).single();
    if (!profile?.email_verified) {
      await supabase.auth.signOut();
      return { success: true, needsVerification: true };
    }
    return { success: true, needsVerification: false };
  }

  async function signOut() { await supabase.auth.signOut(); }

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

  async function sendOtp(userId: string, userEmail: string, userName: string) {
    try {
      const { data: otp, error } = await supabase.rpc('create_verification_otp', { p_user_id: userId });
      if (error || !otp) return false;
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: 'Your Waves & Wires Verification Code',
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
            <div style="background:#f5c018;padding:28px 32px;text-align:center">
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#000">Waves &amp; Wires</h1>
            </div>
            <div style="padding:32px;text-align:center">
              <p style="font-size:15px;color:#333;margin:0 0 8px">Hi ${userName || 'there'},</p>
              <p style="font-size:14px;color:#666;margin:0 0 28px">Your verification code (expires in <strong>10 minutes</strong>):</p>
              <div style="background:#f8f8f8;border:2px dashed #f5c018;border-radius:12px;padding:24px;display:inline-block">
                <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:#111">${otp}</p>
              </div>
              <p style="margin:24px 0 0;font-size:13px;color:#999">If you didn't request this, ignore this email.</p>
            </div>
          </div>`,
        }),
      });
      return true;
    } catch { return false; }
  }

  async function verifyOtp(userId: string, otp: string) {
    const { data, error } = await supabase.rpc('verify_email_otp', { p_user_id: userId, p_otp: otp.trim() });
    if (error) { toast.error(error.message); return false; }
    const result = data as { success: boolean; error?: string };
    if (!result.success) { toast.error(result.error ?? 'Invalid code'); return false; }
    return true;
  }

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAdmin: user?.is_admin ?? false,
      signUp, signIn, signOut, resetPassword, updateProfile, sendOtp, verifyOtp, refreshUser,
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