import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AuthUser {
  id: string; email: string; full_name: string;
  phone?: string; avatar_url?: string;
  email_verified: boolean; is_admin: boolean; created_at: string;
}

interface AuthContextType {
  user: AuthUser | null; session: Session | null;
  isLoading: boolean; isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: { full_name?: string; phone?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function handleSession(sess: Session | null) {
      if (!mounted) return;
      if (!sess?.user) { setUser(null); setSession(null); setLoading(false); return; }
      setSession(sess);
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', sess.user.id).single();
      if (!mounted) return;
      setUser({
        id: sess.user.id, email: sess.user.email ?? '',
        full_name: profile?.full_name ?? sess.user.user_metadata?.full_name ?? '',
        phone: profile?.phone ?? undefined,
        avatar_url: profile?.avatar_url ?? undefined,
        email_verified: sess.user.email_confirmed_at != null,
        is_admin: profile?.is_admin ?? false,
        created_at: sess.user.created_at,
      });
      setLoading(false);
    }

    // getSession for immediate restore on refresh
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));

    // onAuthStateChange for login/logout/token refresh — skip INITIAL_SESSION (handled above)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      handleSession(session);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName },
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?verified=true` },
    });
    if (error) { toast.error(error.message); return false; }
    toast.success('Account created! Check your email to verify.');
    return true;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return false; }
    toast.success('Welcome back!');
    return true;
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/auth?reset=true`,
    });
    if (error) { toast.error(error.message); return false; }
    toast.success('Password reset email sent!'); return true;
  };

  const updateProfile = async (data: { full_name?: string; phone?: string }) => {
    if (!user) return false;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) { toast.error(error.message); return false; }
    setUser(prev => prev ? { ...prev, ...data } : prev);
    toast.success('Profile updated'); return true;
  };

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAdmin: user?.is_admin ?? false,
      signUp, signIn, signOut, resetPassword, updateProfile,
    }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
