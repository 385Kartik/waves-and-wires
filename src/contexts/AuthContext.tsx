import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/api/client';
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

export interface Session {
  access_token: string;
  user: AuthUser;
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
  sendEmailOtp:       (email: string) => Promise<boolean>;
  verifyEmailOtp:     (otp: string, email?: string, fullName?: string) => Promise<boolean>;
  sendSmsOtp:         (phone: string) => Promise<boolean>;
  verifySmsOtp:       (phone: string, otp: string, password?: string, fullName?: string) => Promise<boolean>;
  // Legacy aliases
  sendWhatsAppOtp:    (phone: string) => Promise<boolean>;
  verifyWhatsAppOtp:  (phone: string, otp: string, password?: string, fullName?: string) => Promise<boolean>;
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
    setUser(sess.user);
    setLoading(false);
  }

  async function refreshUser() {
    try {
      const res: any = await authService.session();
      if (res.success && res.data) {
        await handleSession({
          access_token: res.data.token || '',
          user: res.data.user,
        });
      } else {
        await handleSession(null);
      }
    } catch {
      await handleSession(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    authService.session().then((res: any) => {
      if (mounted) {
        if (res.success && res.data) {
          handleSession({
            access_token: res.data.token || '',
            user: res.data.user,
          });
        } else {
          handleSession(null);
        }
      }
    }).catch(() => {
      if (mounted) handleSession(null);
    });

    return () => { mounted = false; };
  }, []);

  // ─── Legacy password methods (kept for interface compatibility) ────────────
  async function signUpWithEmail(email: string, password: string, fullName: string) {
    try {
      const res: any = await authService.register({ email, password, full_name: fullName });
      if (!res.success) {
        const msg = (res.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists'))
          return { success: false, error: 'account_exists' };
        return { success: false, error: res.message };
      }
      await refreshUser();
      sendEmail(email, 'Welcome to Waves & Wires! 🎉', welcomeEmailHtml(fullName));
      apiClient.post('/auth/email-otp', { action: 'send', email: email.trim().toLowerCase() }).catch(() => {});
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  }

  async function signUpWithPhone(phone: string, password: string, fullName: string) {
    const formatted = normalisePhone(phone);
    try {
      const res: any = await authService.register({ phone: formatted, password, full_name: fullName });
      if (!res.success) {
        const msg = (res.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('phone_exists'))
          return { success: false, error: 'phone_exists' };
        return { success: false, error: res.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  }

  async function signInWithEmail(email: string, password: string) {
    try {
      const res: any = await authService.login({ email, password });
      if (!res.success) { toast.error(res.message || 'Login failed'); return false; }
      await refreshUser();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      return false;
    }
  }

  async function signInWithPhone(phone: string, password: string) {
    const formatted = normalisePhone(phone);
    try {
      const res: any = await authService.login({ phone: formatted, password });
      if (!res.success) { toast.error(res.message || 'Login failed'); return false; }
      await refreshUser();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      return false;
    }
  }

  async function signOut() {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setSession(null);
    setLoading(false);
  }

  async function resetPassword(email: string) {
    try {
      const res: any = await apiClient.post('/auth/email-otp', { email, action: 'send' });
      if (!res?.success) { toast.error(res?.message || 'Failed to send OTP'); return false; }
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
      return false;
    }
  }

  async function updateProfile(data: { full_name?: string; phone?: string }) {
    if (!user) return false;
    try {
      const res: any = await authService.updateProfile(data);
      if (!res.success) { toast.error(res.message); return false; }
      setUser(prev => prev ? { ...prev, ...data } : prev);
      toast.success('Profile updated');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
      return false;
    }
  }

  // ─── sendEmailOtp (Works for Sign In, Sign Up, and AccountPage verification) ─
  async function sendEmailOtp(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (user) {
        setUser(prev => prev ? { ...prev, email: cleanEmail, email_verified: false } : prev);
      }
      const res: any = await apiClient.post('/auth/email-otp', { action: 'send', email: cleanEmail });
      if (!res?.success) { toast.error(res?.message || 'Could not send OTP'); return false; }
      toast.success('OTP sent to ' + cleanEmail);
      return true;
    } catch (err: any) { toast.error(err.message || 'Email OTP service unavailable'); return false; }
  }

  // ─── verifyEmailOtp (Passwordless Sign In / Sign Up / Account Email Verify) ──
  async function verifyEmailOtp(otp: string, email?: string, fullName?: string): Promise<boolean> {
    try {
      const cleanEmail = (email || user?.email || '').trim().toLowerCase();
      const res: any = await apiClient.post('/auth/email-otp', {
        action:    'verify',
        otp:       otp.trim(),
        email:     cleanEmail || undefined,
        full_name: fullName,
      });
      if (!res?.success) { toast.error(res?.message || 'Invalid OTP'); return false; }

      const returnedUser = res?.data?.user;
      const returnedToken = res?.data?.token || '';
      if (returnedUser) {
        await handleSession({ access_token: returnedToken, user: returnedUser });
        if (res?.data?.is_new_user && returnedUser.email && !isInternalEmail(returnedUser.email)) {
          sendEmail(returnedUser.email, 'Welcome to Waves & Wires! 🎉', welcomeEmailHtml(returnedUser.full_name || 'Customer'));
        }
      } else if (user) {
        setUser(prev => prev ? { ...prev, email: res?.data?.email || user.email, email_verified: true } : prev);
      }
      toast.success('Email verified! ✓');
      return true;
    } catch (err: any) { toast.error(err.message || 'Verification failed'); return false; }
  }

  // ─── sendSmsOtp (Works for Sign In, Sign Up, and AccountPage verification) ───
  async function sendSmsOtp(phone: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    try {
      const res: any = await apiClient.post('/auth/sms-otp', { action: 'send', phone: formatted });
      if (!res?.success) { toast.error(res?.message || 'Could not send OTP'); return false; }
      toast.success('OTP sent to ' + formatted);
      return true;
    } catch (err: any) { toast.error(err.message || 'OTP service unavailable'); return false; }
  }

  // ─── verifySmsOtp (Passwordless Sign In / Sign Up / Account Phone Verify) ────
  async function verifySmsOtp(phone: string, otp: string, _password?: string, fullName?: string): Promise<boolean> {
    const formatted = normalisePhone(phone);
    try {
      const res: any = await apiClient.post('/auth/sms-otp', {
        action:    'verify',
        phone:     formatted,
        otp:       otp.trim(),
        user_id:   user?.id,
        full_name: fullName,
      });
      if (!res?.success) { toast.error(res?.message || 'Invalid OTP'); return false; }

      const returnedUser = res?.data?.user;
      const returnedToken = res?.data?.token || '';
      if (returnedUser) {
        await handleSession({ access_token: returnedToken, user: returnedUser });
      } else if (user) {
        setUser(prev => prev ? { ...prev, phone: formatted, phone_verified: true } : prev);
      }
      toast.success('Phone verified! ✓');
      return true;
    } catch (err: any) { toast.error(err.message || 'Verification failed'); return false; }
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