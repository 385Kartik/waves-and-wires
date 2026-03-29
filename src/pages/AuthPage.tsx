import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2,
  XCircle, AlertCircle, ShieldCheck, KeyRound, Phone, ChevronRight, MessageSquare,
} from 'lucide-react';
import { useAuth, normalisePhone } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode =
  | 'signin'
  | 'signup'          // step 1: name + email + phone + password (all at once)
  | 'signup_choose'   // step 2: choose verification method (SMS or Email)
  | 'signup_sms'      // step 3a: OTP input for SMS verification path
  | 'verify'          // step 3b: "check your email" for email verification path
  | 'email_collect'   // legacy: phone-only users need to add email
  | 'forgot'
  | 'reset'
  | 'emailotp'
  | 'phone';

// ─── Password rules ───────────────────────────────────────────────────────────
const PW_RULES = [
  { label: 'At least 8 characters',     test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)',           test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character',      test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PW_RULES.filter(r => r.test(password)).length;
  const pct    = (passed / PW_RULES.length) * 100;
  const color  = pct <= 40 ? 'bg-red-500' : pct <= 70 ? 'bg-amber-400' : 'bg-green-500';
  const label  = pct <= 40 ? 'Weak'       : pct <= 70 ? 'Fair'         : pct < 100 ? 'Good' : 'Strong';
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-semibold ${pct <= 40 ? 'text-red-500' : pct <= 70 ? 'text-amber-500' : 'text-green-600'}`}>{label}</span>
      </div>
      {PW_RULES.map(rule => {
        const ok = rule.test(password);
        return (
          <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-muted-foreground'}`}>
            {ok ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}

const inputCls   = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
const inputPlain = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

// Modes where we should NOT auto-navigate home when user becomes logged in
const SKIP_NAV: Mode[] = ['reset', 'signup_sms', 'signup_choose', 'email_collect'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const {
    signIn, signUp, resetPassword, addEmail, user, isLoading,
    sendPhoneOtp, verifyPhoneOtp,
  } = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Mode + shared form state ─────────────────────────────────────────────
  const [mode,      setMode]     = useState<Mode>('signin');
  const [email,     setEmail]    = useState('');
  const [password,  setPassword] = useState('');
  const [confirm,   setConfirm]  = useState('');
  const [fullName,  setFullName] = useState('');
  const [showPw,    setShowPw]   = useState(false);
  const [showCon,   setShowCon]  = useState(false);
  const [busy,      setBusy]     = useState(false);
  const [error,     setError]    = useState('');
  const [info,      setInfo]     = useState('');

  // ── Signup: phone collected at step 1 ────────────────────────────────────
  const [signupPhone,          setSignupPhone]          = useState('');
  const [signupSmsOtp,         setSignupSmsOtp]         = useState('');
  const [signupPhoneFormatted, setSignupPhoneFormatted] = useState('');

  // ── Email collect (legacy phone-only) ────────────────────────────────────
  const [emailCollect, setEmailCollect] = useState('');

  // ── Forgot / reset ───────────────────────────────────────────────────────
  const [forgotSent,  setForgotSent]  = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm,  setNewConfirm]  = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showNewCon,  setShowNewCon]  = useState(false);
  const [resetDone,   setResetDone]   = useState(false);

  // ── Email OTP ────────────────────────────────────────────────────────────
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent,  setOtpSent]  = useState(false);
  const [otpCode,  setOtpCode]  = useState('');

  // ── Phone OTP (login) ────────────────────────────────────────────────────
  const [phoneNum,       setPhoneNum]       = useState('');
  const [phoneSent,      setPhoneSent]      = useState(false);
  const [phoneOtpCode,   setPhoneOtpCode]   = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');

  const requiresEmailCollect = useRef(false);

  // ── URL params ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get('verified') === 'true') { setMode('signin'); setInfo('Email verified! You can now sign in.'); }
    if (searchParams.get('reset')    === 'true') { setMode('signin'); setInfo('Password reset! Sign in with your new password.'); }
  }, [searchParams]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setMode('reset');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // ── Auto navigate when user is signed in ────────────────────────────────
  useEffect(() => {
    if (!isLoading && user) {
      if (requiresEmailCollect.current) {
        requiresEmailCollect.current = false;
        setMode('email_collect');
        return;
      }
      if (!SKIP_NAV.includes(mode)) navigate('/');
    }
  }, [user, isLoading, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const clr      = () => { setError(''); setInfo(''); };
  const isStrong = (pw: string) => PW_RULES.every(r => r.test(pw));

  // ── SIGNIN ───────────────────────────────────────────────────────────────
  async function handleSignin() {
    clr();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setBusy(true);
    const ok = await signIn(email.trim(), password);
    setBusy(false);
    if (ok) navigate('/');
  }

  // ── SIGNUP step 1 — validate locally, proceed to verification choice ─────
  function handleSignupNext() {
    clr();
    if (!fullName.trim())                  { setError('Please enter your full name.'); return; }
    if (!email.trim())                     { setError('Please enter your email.'); return; }
    const phoneDigits = signupPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10)           { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!isStrong(password))               { setError('Password does not meet all requirements.'); return; }
    if (password !== confirm)              { setError('Passwords do not match.'); return; }
    setMode('signup_choose');
  }

  // ── SIGNUP: choose Email verification ────────────────────────────────────
  async function handleChooseEmail() {
    clr();
    setBusy(true);
    const res = await signUp(email.trim(), password, fullName.trim(), signupPhone);
    setBusy(false);
    if (!res.success) {
      if (res.error === 'account_exists') {
        setError('An account with this email already exists.');
        setInfo('Please sign in instead.');
        setTimeout(() => { setMode('signin'); setEmail(email); clr(); }, 2500);
      } else {
        setError(res.error ?? 'Signup failed. Please try again.');
      }
      return;
    }
    setMode('verify');
  }

  // ── SIGNUP: choose SMS verification ──────────────────────────────────────
  // We use signInWithOtp to create a phone-first session, then attach
  // email + password via updateUser so the account is complete.
  async function handleChooseSms() {
    clr();
    const formatted = normalisePhone(signupPhone);
    setSignupPhoneFormatted(formatted);
    setBusy(true);
    const ok = await sendPhoneOtp(signupPhone); // sends SMS OTP
    setBusy(false);
    if (!ok) return;
    setInfo(`OTP sent to ${formatted}`);
    setMode('signup_sms');
  }

  // ── SIGNUP SMS: verify OTP → attach email + password ─────────────────────
  async function handleSignupSmsVerify() {
    clr();
    if (signupSmsOtp.trim().length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setBusy(true);

    // Verify phone OTP — creates a phone-authenticated session
    const ok = await verifyPhoneOtp(signupPhoneFormatted, signupSmsOtp);
    if (!ok) { setBusy(false); return; }

    // Attach email, password, and name to the phone account
    const { error } = await supabase.auth.updateUser({
      email:    email.trim(),
      password: password,
      data:     { full_name: fullName.trim(), phone: signupPhoneFormatted },
    });

    if (error) {
      // If email already registered on another account, warn but still allow
      // (the user has a phone-only account now; they can link email later)
      console.warn('[signup_sms] updateUser email error:', error.message);
      toast.error(error.message);
      setBusy(false);
      return;
    }

    // Update profile row
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await supabase.from('profiles').upsert({
        id:        authUser.id,
        full_name: fullName.trim(),
        email:     email.trim(),
        phone:     signupPhoneFormatted,
      }, { onConflict: 'id' });
    }

    // Fire welcome email (fire-and-forget; email link will also verify email)
    sendEmail(email.trim(), 'Welcome to Waves & Wires! 🎉', welcomeEmailHtml(fullName.trim()));

    setBusy(false);
    navigate('/');
  }

  // ── EMAIL COLLECT (legacy phone-only users) ───────────────────────────────
  async function handleEmailCollect() {
    clr();
    const cleanEmail = emailCollect.trim().toLowerCase();
    if (!cleanEmail.includes('@')) { setError('Please enter a valid email address.'); return; }
    setBusy(true);
    const ok = await addEmail(cleanEmail);
    setBusy(false);
    if (!ok) return;
    toast.info(`Verification email sent to ${cleanEmail}. Verify it to place orders.`, { duration: 6000 });
    navigate('/');
  }

  // ── FORGOT ────────────────────────────────────────────────────────────────
  async function handleForgot() {
    clr();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    const ok = await resetPassword(email.trim());
    setBusy(false);
    if (ok) setForgotSent(true);
  }

  // ── RESET ─────────────────────────────────────────────────────────────────
  async function handleReset() {
    clr();
    if (!isStrong(newPassword)) { setError('Password does not meet all requirements.'); return; }
    if (newPassword !== newConfirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setResetDone(true);
    setTimeout(() => { setMode('signin'); setInfo('Password updated! Sign in with your new password.'); }, 2000);
  }

  // ── EMAIL OTP — send ──────────────────────────────────────────────────────
  async function handleEmailOtpSend() {
    clr();
    if (!otpEmail.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail.trim(), options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setOtpSent(true);
    setInfo('OTP sent to your email. Check your inbox.');
  }

  // ── EMAIL OTP — verify ────────────────────────────────────────────────────
  async function handleEmailOtpVerify() {
    clr();
    if (!otpCode.trim()) { setError('Please enter the OTP.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail.trim(), token: otpCode.trim(), type: 'email',
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    navigate('/');
  }

  // ── PHONE OTP (login) — send ──────────────────────────────────────────────
  async function handlePhoneOtpSend() {
    clr();
    const digits = phoneNum.replace(/\D/g, '');
    if (digits.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    const formatted = normalisePhone(phoneNum);
    setPhoneFormatted(formatted);
    setBusy(true);
    const ok = await sendPhoneOtp(phoneNum);
    setBusy(false);
    if (!ok) return;
    setPhoneSent(true);
    setInfo(`OTP sent to ${formatted}`);
  }

  // ── PHONE OTP (login) — verify ────────────────────────────────────────────
  // After verify: if user has email → go home. If no email → email_collect (legacy).
  async function handlePhoneOtpVerify() {
    clr();
    if (phoneOtpCode.trim().length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setBusy(true);
    const ok = await verifyPhoneOtp(phoneFormatted, phoneOtpCode);
    if (!ok) { setBusy(false); return; }
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    // Only redirect to email_collect for truly phone-only accounts (no email at all)
    if (!freshUser?.email) {
      requiresEmailCollect.current = true;
    }
    setBusy(false);
    // useEffect will handle navigation
  }

  // ── Form submit router ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signin')        return handleSignin();
    if (mode === 'signup')        return handleSignupNext();
    if (mode === 'signup_sms')    return handleSignupSmsVerify();
    if (mode === 'email_collect') return handleEmailCollect();
    if (mode === 'forgot')        return handleForgot();
    if (mode === 'reset')         return handleReset();
    if (mode === 'emailotp')      return otpSent ? handleEmailOtpVerify() : handleEmailOtpSend();
    if (mode === 'phone')         return phoneSent ? handlePhoneOtpVerify() : handlePhoneOtpSend();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const signupStep = mode === 'signup' ? 1 : (mode === 'signup_choose' || mode === 'signup_sms') ? 2 : null;

  const titles: Partial<Record<Mode, string>> = {
    signin:        'Welcome Back',
    signup:        'Create Account',
    signup_choose: 'Verify Your Account',
    signup_sms:    'Enter SMS OTP',
    email_collect: 'Add Your Email',
    forgot:        'Reset Password',
    verify:        'Check Your Email',
    reset:         'Set New Password',
    emailotp:      'Login with Email OTP',
    phone:         'Login with Phone OTP',
  };

  const subs: Partial<Record<Mode, string>> = {
    signin:        'Sign in to Waves & Wires',
    signup:        'Fill in your details to get started',
    signup_choose: 'Choose how to verify your new account',
    signup_sms:    `OTP sent to ${signupPhoneFormatted}`,
    email_collect: 'Required for order confirmations & invoices',
    forgot:        "We'll send a reset link to your email",
    verify:        `Verification link sent to ${email}`,
    reset:         'Enter your new password below',
    emailotp:      'No password needed — sign in with OTP',
    phone:         'Enter your mobile number to receive OTP',
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-secondary/30">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Branding + step indicator */}
          <div className="mb-7 text-center">
            {signupStep && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2].map(s => (
                  <div key={s} className={`h-2 rounded-full transition-all ${
                    s === signupStep ? 'w-8 bg-primary' : 'w-4 bg-primary/25'
                  }`} />
                ))}
              </div>
            )}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm shadow-primary/30">
              <span className="text-sm font-black text-primary-foreground">W&W</span>
            </div>
            <h1 className="text-xl font-black text-foreground">{titles[mode]}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subs[mode]}</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {info && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">{info}</p>
            </div>
          )}

          {/* ── Verify email screen ──────────────────────────────────── */}
          {mode === 'verify' && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in the email to verify your account. Check your spam folder if you don't see it.
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                ⚠️ Both email and phone must be verified to place orders.
              </div>
              <button onClick={() => { setMode('signin'); clr(); }}
                className="text-sm text-primary font-bold hover:underline">← Back to Sign In</button>
            </div>
          )}

          {/* ── Signup choose verification screen ───────────────────── */}
          {mode === 'signup_choose' && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground text-center">
                Both methods will ask for both email &amp; phone. You can verify the other one anytime from your account.
              </p>

              {/* SMS option */}
              <button
                onClick={handleChooseSms}
                disabled={busy}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-60">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                  <MessageSquare className="h-6 w-6 text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Verify via SMS OTP</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send a 6-digit OTP to +91 {signupPhone}
                  </p>
                  <p className="text-xs text-green-600 font-semibold mt-1">✓ Instant — No email needed first</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* Email option */}
              <button
                onClick={handleChooseEmail}
                disabled={busy}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-60">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Mail className="h-6 w-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Verify via Email Link</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send a verification link to {email}
                  </p>
                  <p className="text-xs text-blue-600 font-semibold mt-1">✓ Secure — Click link to activate</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {busy && (
                <div className="flex justify-center py-2">
                  <span className="h-5 w-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}

              <button
                onClick={() => { setMode('signup'); clr(); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                ← Back to edit details
              </button>
            </div>
          )}

          {/* ── Reset done screen ───────────────────────────────────── */}
          {mode === 'reset' && resetDone && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-bold text-foreground">Password updated!</p>
              <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
            </div>
          )}

          {/* ── Form ─────────────────────────────────────────────────── */}
          {!['verify', 'signup_choose'].includes(mode) && !resetDone && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* SIGNUP step 1 — all fields ────────────────────────── */}
              {mode === 'signup' && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="text" required autoFocus value={fullName}
                        onChange={e => { setFullName(e.target.value); clr(); }}
                        placeholder="Rahul Sharma" className={inputCls} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" required value={email}
                        onChange={e => { setEmail(e.target.value); clr(); }}
                        placeholder="you@example.com" className={inputCls} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Number *</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel" required inputMode="numeric" maxLength={10}
                        value={signupPhone}
                        onChange={e => { setSignupPhone(e.target.value.replace(/\D/g, '')); clr(); }}
                        placeholder="9876543210"
                        className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPw ? 'text' : 'password'} required minLength={8}
                        value={password} onChange={e => { setPassword(e.target.value); clr(); }}
                        placeholder="••••••••" className={inputCls} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type={showCon ? 'text' : 'password'} required value={confirm}
                        onChange={e => { setConfirm(e.target.value); clr(); }}
                        placeholder="••••••••"
                        className={`${inputCls} ${confirm ? (confirm === password ? 'border-green-400' : 'border-red-300') : ''}`} />
                      <button type="button" onClick={() => setShowCon(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirm && confirm !== password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />Passwords do not match</p>}
                    {confirm && confirm === password  && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Passwords match</p>}
                  </div>
                </>
              )}

              {/* SIGNUP SMS OTP ────────────────────────────────────────── */}
              {mode === 'signup_sms' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">6-Digit OTP *</label>
                  <input
                    type="text" required inputMode="numeric" maxLength={6} autoFocus
                    value={signupSmsOtp}
                    onChange={e => { setSignupSmsOtp(e.target.value.replace(/\D/g, '')); clr(); }}
                    placeholder="• • • • • •"
                    className={`${inputPlain} text-center tracking-[0.6em] font-bold text-xl`}
                  />
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    Didn't receive it?{' '}
                    <button type="button" onClick={handleChooseSms} className="text-primary font-semibold hover:underline">
                      Resend OTP
                    </button>
                  </p>
                </div>
              )}

              {/* EMAIL COLLECT (legacy) ─────────────────────────────── */}
              {mode === 'email_collect' && (
                <>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                    📦 An email address is required for order confirmations and invoices.
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" required autoFocus value={emailCollect}
                        onChange={e => { setEmailCollect(e.target.value); clr(); }}
                        placeholder="you@example.com" className={inputCls} />
                    </div>
                  </div>
                </>
              )}

              {/* SIGNIN ──────────────────────────────────────────────── */}
              {mode === 'signin' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" required autoFocus value={email}
                        onChange={e => { setEmail(e.target.value); clr(); }}
                        placeholder="you@example.com" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPw ? 'text' : 'password'} required value={password}
                        onChange={e => { setPassword(e.target.value); clr(); }}
                        placeholder="••••••••" className={inputCls} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right -mt-1">
                    <button type="button" onClick={() => { setMode('forgot'); clr(); }}
                      className="text-xs text-primary hover:underline font-semibold">
                      Forgot password?
                    </button>
                  </div>
                </>
              )}

              {/* FORGOT ──────────────────────────────────────────────── */}
              {mode === 'forgot' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required autoFocus value={email}
                      onChange={e => { setEmail(e.target.value); clr(); }}
                      placeholder="you@example.com" className={inputCls} />
                  </div>
                </div>
              )}

              {/* EMAIL OTP ───────────────────────────────────────────── */}
              {mode === 'emailotp' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" required value={otpEmail}
                        onChange={e => { setOtpEmail(e.target.value); clr(); }}
                        placeholder="you@example.com" disabled={otpSent} className={inputCls} />
                    </div>
                  </div>
                  {otpSent && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">OTP Code *</label>
                      <input type="text" required inputMode="numeric" maxLength={6}
                        value={otpCode} onChange={e => { setOtpCode(e.target.value); clr(); }}
                        placeholder="Enter 6-digit OTP" autoFocus className={inputPlain} />
                      <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); clr(); }}
                        className="mt-1 text-xs text-muted-foreground hover:text-primary">
                        Use different email
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* PHONE OTP (login) ──────────────────────────────────── */}
              {mode === 'phone' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Number *</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel" required inputMode="numeric" maxLength={10}
                        value={phoneNum}
                        onChange={e => { setPhoneNum(e.target.value.replace(/\D/g, '')); clr(); }}
                        placeholder="9876543210" disabled={phoneSent} autoFocus
                        className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Works if your phone number was verified on your account.
                    </p>
                  </div>
                  {phoneSent && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Enter OTP *</label>
                      <input
                        type="text" required inputMode="numeric" maxLength={6}
                        value={phoneOtpCode}
                        onChange={e => { setPhoneOtpCode(e.target.value.replace(/\D/g, '')); clr(); }}
                        placeholder="6-digit OTP" autoFocus
                        className={`${inputPlain} text-center tracking-[0.5em] font-bold text-lg`}
                      />
                      <button type="button"
                        onClick={() => { setPhoneSent(false); setPhoneOtpCode(''); clr(); }}
                        className="mt-1.5 text-xs text-muted-foreground hover:text-primary">
                        Use different number
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* RESET ───────────────────────────────────────────────── */}
              {mode === 'reset' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type={showNew ? 'text' : 'password'} required autoFocus
                        value={newPassword} onChange={e => { setNewPassword(e.target.value); clr(); }}
                        placeholder="••••••••" className={inputCls} />
                      <button type="button" onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={newPassword} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password *</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type={showNewCon ? 'text' : 'password'} required
                        value={newConfirm} onChange={e => { setNewConfirm(e.target.value); clr(); }}
                        placeholder="••••••••"
                        className={`${inputCls} ${newConfirm ? (newConfirm === newPassword ? 'border-green-400' : 'border-red-300') : ''}`} />
                      <button type="button" onClick={() => setShowNewCon(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNewCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {newConfirm && newConfirm !== newPassword && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />Passwords do not match</p>}
                    {newConfirm && newConfirm === newPassword  && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Passwords match</p>}
                  </div>
                </>
              )}

              {/* Submit button */}
              {mode === 'forgot' && forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Reset link sent!</p>
                  <p className="text-xs text-muted-foreground">Check your inbox and click the link.</p>
                </div>
              ) : (
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/20 mt-2">
                  {busy
                    ? <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    : <>
                        {mode === 'signin'        && <><ArrowRight className="h-4 w-4" />Sign In</>}
                        {mode === 'signup'        && <><ChevronRight className="h-4 w-4" />Continue — Choose Verification</>}
                        {mode === 'signup_sms'    && <><Phone className="h-4 w-4" />Verify & Create Account</>}
                        {mode === 'email_collect' && <><Mail className="h-4 w-4" />Save Email & Continue</>}
                        {mode === 'forgot'        && <><Mail className="h-4 w-4" />Send Reset Link</>}
                        {mode === 'reset'         && <><KeyRound className="h-4 w-4" />Set New Password</>}
                        {mode === 'emailotp'      && <><ShieldCheck className="h-4 w-4" />{otpSent ? 'Verify OTP' : 'Send OTP'}</>}
                        {mode === 'phone'         && <><Phone className="h-4 w-4" />{phoneSent ? 'Verify OTP' : 'Send OTP via SMS'}</>}
                      </>
                  }
                </button>
              )}
            </form>
          )}

          {/* ── Bottom links ─────────────────────────────────────────── */}
          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
            {mode === 'signin' && (
              <>
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); clr(); }} className="text-primary font-bold hover:underline">
                    Sign up free
                  </button>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or sign in with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMode('emailotp'); clr(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                    <Mail className="h-3.5 w-3.5" /> Email OTP
                  </button>
                  <button
                    onClick={() => { setMode('phone'); clr(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                    <Phone className="h-3.5 w-3.5" /> Phone OTP
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); clr(); }} className="text-primary font-bold hover:underline">
                  Sign in
                </button>
              </p>
            )}

            {(mode === 'forgot' || mode === 'emailotp' || mode === 'phone') && (
              <button
                onClick={() => {
                  setMode('signin'); clr();
                  setOtpSent(false); setOtpCode('');
                  setPhoneSent(false); setPhoneOtpCode(''); setPhoneNum('');
                }}
                className="text-primary font-bold hover:underline">
                ← Back to Sign In
              </button>
            )}

            {mode === 'email_collect' && (
              <button onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground text-xs">
                Skip for now (some features unavailable)
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/terms-of-service" className="text-primary hover:underline">Terms</a> &amp;{' '}
          <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}