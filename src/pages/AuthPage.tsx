import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2,
  XCircle, AlertCircle, ShieldCheck, KeyRound, Phone,
} from 'lucide-react';
import { useAuth, normalisePhone } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ─── Password rules ───────────────────────────────────────────────────────
type Mode = 'signin' | 'signup' | 'forgot' | 'verify' | 'reset' | 'emailotp' | 'phone';

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
  const label  = pct <= 40 ? 'Weak' : pct <= 70 ? 'Fair' : pct < 100 ? 'Good' : 'Strong';
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
const inputNoPl  = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

// ─── Component ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { signIn, signUp, resetPassword, user, isLoading, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode,       setMode]       = useState<Mode>('signin');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [fullName,   setFullName]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [showCon,    setShowCon]    = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');
  const [info,       setInfo]       = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Reset password
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm,  setNewConfirm]  = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showNewCon,  setShowNewCon]  = useState(false);
  const [resetDone,   setResetDone]   = useState(false);

  // Email OTP
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent,  setOtpSent]  = useState(false);
  const [otpCode,  setOtpCode]  = useState('');

  // Phone OTP
  const [phoneNum,      setPhoneNum]      = useState('');
  const [phoneSent,     setPhoneSent]     = useState(false);
  const [phoneOtpCode,  setPhoneOtpCode]  = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');

  useEffect(() => {
    if (!isLoading && user && mode !== 'reset') navigate('/');
  }, [user, isLoading, mode]);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') { setMode('signin'); setInfo('Email verified! You can now sign in.'); }
    if (searchParams.get('reset') === 'true')    { setMode('signin'); setInfo('Password reset! Sign in with your new password.'); }
  }, [searchParams]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setMode('reset');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const clr      = () => { setError(''); setInfo(''); };
  const isStrong = (pw: string) => PW_RULES.every(r => r.test(pw));

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSignup() {
    clr();
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!isStrong(password)) { setError('Password does not meet all requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const res = await signUp(email.trim(), password, fullName.trim());
    setBusy(false);
    if (!res.success) {
      if (res.error === 'account_exists') {
        setError('An account with this email already exists.');
        setInfo('Please sign in instead.');
        setTimeout(() => { setMode('signin'); setEmail(email); clr(); }, 2500);
      } else setError(res.error ?? 'Signup failed.');
      return;
    }
    setMode('verify');
  }

  async function handleSignin() {
    clr();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setBusy(true);
    const ok = await signIn(email.trim(), password);
    setBusy(false);
    if (ok) navigate('/');
  }

  async function handleForgot() {
    clr();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    const ok = await resetPassword(email.trim());
    setBusy(false);
    if (ok) setForgotSent(true);
  }

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

  // Email OTP
  async function handleEmailOtpSend() {
    clr();
    if (!otpEmail.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setOtpSent(true);
    setInfo('OTP sent to your email. Check your inbox.');
  }

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

  // Phone OTP
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
    setInfo(`OTP sent to ${formatted}. Check your SMS.`);
  }

  async function handlePhoneOtpVerify() {
    clr();
    if (phoneOtpCode.trim().length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setBusy(true);
    const ok = await verifyPhoneOtp(phoneFormatted, phoneOtpCode);
    setBusy(false);
    if (ok) navigate('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signin')   return handleSignin();
    if (mode === 'signup')   return handleSignup();
    if (mode === 'forgot')   return handleForgot();
    if (mode === 'reset')    return handleReset();
    if (mode === 'emailotp') return otpSent ? handleEmailOtpVerify() : handleEmailOtpSend();
    if (mode === 'phone')    return phoneSent ? handlePhoneOtpVerify() : handlePhoneOtpSend();
  }

  // ── Title / subtitle maps ─────────────────────────────────────────────

  const titles: Record<Mode, string> = {
    signin:   'Welcome Back',
    signup:   'Create Account',
    forgot:   'Reset Password',
    verify:   'Check Your Email',
    reset:    'Set New Password',
    emailotp: 'Login with Email OTP',
    phone:    'Login with Phone OTP',
  };

  const subs: Record<Mode, string> = {
    signin:   'Sign in to Waves & Wires',
    signup:   'Join us for exclusive deals',
    forgot:   "We'll send a reset link to your email",
    verify:   `Verification link sent to ${email}`,
    reset:    'Enter your new password below',
    emailotp: 'No password needed — sign in with OTP',
    phone:    'Enter your mobile number to receive OTP',
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-secondary/30">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Branding */}
          <div className="mb-7 text-center">
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

          {/* ── Verify state ───────────────────────────────────────────── */}
          {mode === 'verify' && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in the email to verify your account. Check your spam folder if you don't see it.
              </p>
              <button onClick={() => { setMode('signin'); clr(); }}
                className="text-sm text-primary font-bold hover:underline">← Back to Sign In</button>
            </div>
          )}

          {/* ── Reset done state ───────────────────────────────────────── */}
          {mode === 'reset' && resetDone && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-bold text-foreground">Password updated!</p>
              <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
            </div>
          )}

          {/* ── Form ──────────────────────────────────────────────────── */}
          {mode !== 'verify' && !resetDone && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" required autoFocus value={fullName}
                      onChange={e => { setFullName(e.target.value); clr(); }}
                      placeholder="Rahul Sharma" className={inputCls} />
                  </div>
                </div>
              )}

              {/* Email — signin, signup, forgot */}
              {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required value={email}
                      onChange={e => { setEmail(e.target.value); clr(); }}
                      placeholder="you@example.com"
                      autoFocus={mode !== 'signup'}
                      className={inputCls} />
                  </div>
                </div>
              )}

              {/* ── Email OTP mode ─────────────────────────────────────── */}
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
                        placeholder="Enter 6-digit OTP" autoFocus className={inputNoPl} />
                      <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); clr(); }}
                        className="mt-1 text-xs text-muted-foreground hover:text-primary">
                        Use different email
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Phone OTP mode ─────────────────────────────────────── */}
              {mode === 'phone' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Mobile Number *
                    </label>
                    <div className="flex gap-2">
                      {/* Country code badge */}
                      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel" required inputMode="numeric" maxLength={10}
                        value={phoneNum}
                        onChange={e => { setPhoneNum(e.target.value.replace(/\D/g, '')); clr(); }}
                        placeholder="9876543210"
                        disabled={phoneSent}
                        autoFocus
                        className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      You'll receive a 6-digit OTP via SMS.
                    </p>
                  </div>

                  {phoneSent && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Enter OTP *
                      </label>
                      <input
                        type="text" required inputMode="numeric" maxLength={6}
                        value={phoneOtpCode}
                        onChange={e => { setPhoneOtpCode(e.target.value.replace(/\D/g, '')); clr(); }}
                        placeholder="6-digit OTP"
                        autoFocus
                        className={`${inputNoPl} text-center tracking-[0.5em] font-bold text-lg`}
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

              {/* Password — signin, signup */}
              {(mode === 'signin' || mode === 'signup') && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? 'text' : 'password'} required
                      minLength={mode === 'signup' ? 8 : 1}
                      value={password} onChange={e => { setPassword(e.target.value); clr(); }}
                      placeholder="••••••••" className={inputCls} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === 'signup' && <PasswordStrength password={password} />}
                </div>
              )}

              {/* Confirm password (signup) */}
              {mode === 'signup' && (
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
              )}

              {/* New password (reset mode) */}
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

              {/* Forgot password link (signin only) */}
              {mode === 'signin' && (
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => { setMode('forgot'); clr(); }}
                    className="text-xs text-primary hover:underline font-semibold">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit button or Forgot-sent state */}
              {mode === 'forgot' && forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Reset link sent!</p>
                  <p className="text-xs text-muted-foreground">Check your inbox and click the link to reset your password.</p>
                </div>
              ) : (
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/20 mt-2">
                  {busy
                    ? <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    : <>
                        {mode === 'signin'   && <><ArrowRight className="h-4 w-4" />Sign In</>}
                        {mode === 'signup'   && <><User className="h-4 w-4" />Create Account</>}
                        {mode === 'forgot'   && <><Mail className="h-4 w-4" />Send Reset Link</>}
                        {mode === 'reset'    && <><KeyRound className="h-4 w-4" />Set New Password</>}
                        {mode === 'emailotp' && <><ShieldCheck className="h-4 w-4" />{otpSent ? 'Verify OTP' : 'Send OTP'}</>}
                        {mode === 'phone'    && <><Phone className="h-4 w-4" />{phoneSent ? 'Verify OTP' : 'Send OTP via SMS'}</>}
                      </>
                  }
                </button>
              )}
            </form>
          )}

          {/* ── Bottom links ──────────────────────────────────────────── */}
          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">

            {mode === 'signin' && (
              <>
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); clr(); }} className="text-primary font-bold hover:underline">
                    Sign up free
                  </button>
                </p>
                {/* Login alternatives */}
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