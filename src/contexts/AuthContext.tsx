import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

export interface AuthUser {
  id: string; email: string; full_name: string;
  phone?: string; avatar_url?: string;
  email_verified: boolean; is_admin: boolean; created_at: string;
}

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: { full_name?: string; phone?: string }) => Promise<boolean>;
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
      id:             sess.user.id,
      email:          sess.user.email ?? '',
      full_name:      profile?.full_name ?? sess.user.user_metadata?.full_name ?? '',
      phone:          profile?.phone ?? undefined,
      avatar_url:     profile?.avatar_url ?? undefined,
      email_verified: sess.user.email_confirmed_at != null,
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

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?verified=true`,
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists'))
        return { success: false, error: 'account_exists' };
      return { success: false, error: error.message };
    }
    if (data.user && (!data.user.identities || data.user.identities.length === 0))
      return { success: false, error: 'account_exists' };

    // Welcome email
    sendEmail(email, 'Welcome to Waves & Wires! 🎉', welcomeEmailHtml(fullName));

    return { success: true };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return false; }
    return true;
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

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAdmin: user?.is_admin ?? false,
      signUp, signIn, signOut, resetPassword, updateProfile,
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