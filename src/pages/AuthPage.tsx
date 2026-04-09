import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2,
  XCircle, AlertCircle, ShieldCheck, KeyRound, Phone,
} from 'lucide-react';
import { useAuth, normalisePhone } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode =
  | 'signin_email'
  | 'signin_phone'
  | 'signup_email'
  | 'signup_phone'
  | 'signup_phone_otp'
  | 'forgot'
  | 'reset'
  | 'verify';

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
      {PW_RULES.map(r => {
        const ok = r.test(password);
        return (
          <div key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-muted-foreground'}`}>
            {ok ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

const ic  = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
const icp = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const {
    signUpWithEmail, signUpWithPhone,
    signInWithEmail, signInWithPhone,
    resetPassword, sendWhatsAppOtp, verifyWhatsAppOtp,
    user, isLoading,
  } = useAuth();

  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode,      setMode]    = useState<Mode>('signin_email');
  const [busy,      setBusy]    = useState(false);
  const [error,     setError]   = useState('');
  const [info,      setInfo]    = useState('');

  // Shared fields
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [otp,       setOtp]       = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Reset
  const [newPw,     setNewPw]     = useState('');
  const [newPwCon,  setNewPwCon]  = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [showNewCon,setShowNewCon]= useState(false);
  const [resetDone, setResetDone] = useState(false);

  const clr      = () => { setError(''); setInfo(''); };
  const isStrong = (pw: string) => PW_RULES.every(r => r.test(pw));

  // URL params
  useEffect(() => {
    if (searchParams.get('verified') === 'true') { setMode('signin_email'); setInfo('Email verified! You can now sign in.'); }
    if (searchParams.get('reset')    === 'true') { setMode('signin_email'); setInfo('Password updated! Please sign in.'); }
    if (window.location.hash.includes('type=recovery')) {
      setMode('reset');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);

  // Auto navigate
  useEffect(() => {
    const skip: Mode[] = ['reset', 'signup_phone_otp', 'verify'];
    if (!isLoading && user && !skip.includes(mode)) navigate('/');
  }, [user, isLoading, mode]); // eslint-disable-line

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSigninEmail() {
    clr();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setBusy(true);
    const ok = await signInWithEmail(email.trim(), password);
    setBusy(false);
    if (ok) navigate('/');
  }

  async function handleSigninPhone() {
    clr();
    const d = phone.replace(/\D/g, '');
    if (d.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (!password)      { setError('Please enter your password.'); return; }
    setBusy(true);
    const ok = await signInWithPhone(phone, password);
    setBusy(false);
    if (ok) navigate('/');
  }

  async function handleSignupEmail() {
    clr();
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim())    { setError('Please enter your email.'); return; }
    if (!isStrong(password)) { setError('Password does not meet all requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const res = await signUpWithEmail(email.trim(), password, fullName.trim());
    setBusy(false);
    if (!res.success) {
      if (res.error === 'account_exists') {
        setError('This email is already registered. Please sign in.');
        setTimeout(() => { setMode('signin_email'); setEmail(email); clr(); }, 2500);
      } else setError(res.error ?? 'Signup failed');
      return;
    }
    setMode('verify');
  }

  async function handleSignupPhone() {
    clr();
    const d = phone.replace(/\D/g, '');
    if (!fullName.trim())    { setError('Please enter your full name.'); return; }
    if (d.length < 10)       { setError('Enter a valid 10-digit mobile number.'); return; }
    if (!isStrong(password)) { setError('Password does not meet all requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setBusy(true);
    // Step 1: Account banao (signin yahan NAHI hoga)
    const res = await signUpWithPhone(phone, password, fullName.trim());
    if (!res.success) {
      setBusy(false);
      if (res.error === 'phone_exists') {
        setError('This phone number is already registered. Please sign in.');
        setTimeout(() => { setMode('signin_phone'); setPhone(phone); clr(); }, 2500);
      } else setError(res.error ?? 'Signup failed');
      return;
    }

    // Step 2: OTP bhejo — verify hone ke baad signin hoga
    const sent = await sendWhatsAppOtp(phone);
    setBusy(false);
    if (sent) setMode('signup_phone_otp');
  }

  async function handlePhoneOtpVerify() {
    clr();
    if (otp.trim().length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setBusy(true);
    // Step 1: OTP verify karo — server side email_confirm = true ho jaayega
    const ok = await verifyWhatsAppOtp(phone, otp, password, fullName);
    if (!ok) { setBusy(false); return; }

    // Step 2: Ab signin karo — email confirmed hai toh 400 nahi aayega
    const signedIn = await signInWithPhone(phone, password);
    setBusy(false);
    if (signedIn) navigate('/');
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
    if (!isStrong(newPw))     { setError('Password does not meet requirements.'); return; }
    if (newPw !== newPwCon)   { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setResetDone(true);
    setTimeout(() => { setMode('signin_email'); setInfo('Password updated!'); }, 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signin_email')     return handleSigninEmail();
    if (mode === 'signin_phone')     return handleSigninPhone();
    if (mode === 'signup_email')     return handleSignupEmail();
    if (mode === 'signup_phone')     return handleSignupPhone();
    if (mode === 'signup_phone_otp') return handlePhoneOtpVerify();
    if (mode === 'forgot')           return handleForgot();
    if (mode === 'reset')            return handleReset();
  }

  // ── Go to phone mode (clear fields) ───────────────────────────────────────
  function toPhoneSignup() { setMode('signup_phone'); clr(); setFullName(''); setPhone(''); setPassword(''); setConfirm(''); }
  function toEmailSignup() { setMode('signup_email'); clr(); setFullName(''); setEmail(''); setPassword(''); setConfirm(''); }
  function toPhoneSignin() { setMode('signin_phone'); clr(); setPhone(''); setPassword(''); }
  function toEmailSignin() { setMode('signin_email'); clr(); setEmail(''); setPassword(''); }

  // ── Title / subtitle ──────────────────────────────────────────────────────
  const titles: Partial<Record<Mode, string>> = {
    signin_email:    'Welcome Back',
    signin_phone:    'Sign In with Phone',
    signup_email:    'Create Account',
    signup_phone:    'Sign Up with Phone',
    signup_phone_otp:'Verify Your Phone',
    forgot:          'Reset Password',
    verify:          'Check Your Email',
    reset:           'Set New Password',
  };
  const subs: Partial<Record<Mode, string>> = {
    signin_email:    'Sign in to Waves & Wires',
    signin_phone:    'Enter your phone number and password',
    signup_email:    'Sign up with your email address',
    signup_phone:    'Sign up with your mobile number',
    signup_phone_otp:`OTP sent to +91 ${phone} via SMS`,
    forgot:          "We'll send a reset link to your email",
    verify:          `Verification link sent to ${email}`,
    reset:           'Enter your new password below',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

          {/* ── Verify email screen ───────────────────────────────── */}
          {mode === 'verify' && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to verify your account. Check spam if you don't see it.
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                ⚠️ You'll also need to add & verify a phone number to place orders.
              </div>
              <button onClick={() => { setMode('signin_email'); clr(); }} className="text-sm text-primary font-bold hover:underline">
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* ── Reset done ────────────────────────────────────────── */}
          {mode === 'reset' && resetDone && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-bold text-foreground">Password updated! Redirecting…</p>
            </div>
          )}

          {/* ── Forms ────────────────────────────────────────────── */}
          {!['verify'].includes(mode) && !resetDone && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* SIGNUP EMAIL ─────────────────────────────────────── */}
              {mode === 'signup_email' && <>
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative"><User className="icon" />
                    <input type="text" required autoFocus value={fullName} onChange={e => { setFullName(e.target.value); clr(); }} placeholder="Rahul Sharma" className={ic} />
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <div className="relative"><Mail className="icon" />
                    <input type="email" required value={email} onChange={e => { setEmail(e.target.value); clr(); }} placeholder="you@example.com" className={ic} />
                  </div>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative"><Lock className="icon" />
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => { setPassword(e.target.value); clr(); }} placeholder="••••••••" className={ic} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="abs-eye">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <div className="relative"><Lock className="icon" />
                    <input type={showCon ? 'text' : 'password'} required value={confirm} onChange={e => { setConfirm(e.target.value); clr(); }} placeholder="••••••••" className={`${ic} ${confirm ? (confirm === password ? 'border-green-400' : 'border-red-300') : ''}`} />
                    <button type="button" onClick={() => setShowCon(v => !v)} className="abs-eye">{showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {confirm && confirm !== password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />Passwords do not match</p>}
                </div>
              </>}

              {/* SIGNUP PHONE ─────────────────────────────────────── */}
              {mode === 'signup_phone' && <>
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative"><User className="icon" />
                    <input type="text" required autoFocus value={fullName} onChange={e => { setFullName(e.target.value); clr(); }} placeholder="Rahul Sharma" className={ic} />
                  </div>
                </div>
                <div>
                  <label className="label">Mobile Number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">🇮🇳 +91</div>
                    <input type="tel" required inputMode="numeric" maxLength={10} value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); clr(); }} placeholder="9876543210" className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">OTP will be sent to this number via SMS</p>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative"><Lock className="icon" />
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => { setPassword(e.target.value); clr(); }} placeholder="••••••••" className={ic} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="abs-eye">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <div className="relative"><Lock className="icon" />
                    <input type={showCon ? 'text' : 'password'} required value={confirm} onChange={e => { setConfirm(e.target.value); clr(); }} placeholder="••••••••" className={`${ic} ${confirm ? (confirm === password ? 'border-green-400' : 'border-red-300') : ''}`} />
                    <button type="button" onClick={() => setShowCon(v => !v)} className="abs-eye">{showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {confirm && confirm !== password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />Passwords do not match</p>}
                </div>
              </>}

              {/* SIGNUP PHONE OTP ─────────────────────────────────── */}
              {mode === 'signup_phone_otp' && <>
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-700">
                   📱 Check SMS on +91 {phone} for your 6-digit OTP
                </div>
                <div>
                  <label className="label">Enter OTP *</label>
                  <input type="text" inputMode="numeric" maxLength={6} autoFocus value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); clr(); }} placeholder="• • • • • •" className={`${icp} text-center tracking-[0.6em] font-bold text-xl`} />
                </div>
                <button type="button" onClick={() => { setBusy(true); sendWhatsAppOtp(phone).finally(() => setBusy(false)); }} className="text-xs text-primary hover:underline">
                  Didn't get it? Resend OTP
                </button>
              </>}

              {/* SIGNIN EMAIL ────────────────────────────────────── */}
              {mode === 'signin_email' && <>
                <div>
                  <label className="label">Email *</label>
                  <div className="relative"><Mail className="icon" />
                    <input type="email" required autoFocus value={email} onChange={e => { setEmail(e.target.value); clr(); }} placeholder="you@example.com" className={ic} />
                  </div>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative"><Lock className="icon" />
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => { setPassword(e.target.value); clr(); }} placeholder="••••••••" className={ic} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="abs-eye">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => { setMode('forgot'); clr(); }} className="text-xs text-primary hover:underline font-semibold">Forgot password?</button>
                </div>
              </>}

              {/* SIGNIN PHONE ────────────────────────────────────── */}
              {mode === 'signin_phone' && <>
                <div>
                  <label className="label">Mobile Number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">🇮🇳 +91</div>
                    <input type="tel" required inputMode="numeric" maxLength={10} autoFocus value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); clr(); }} placeholder="9876543210" className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative"><Lock className="icon" />
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => { setPassword(e.target.value); clr(); }} placeholder="••••••••" className={ic} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="abs-eye">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
              </>}

              {/* FORGOT ──────────────────────────────────────────── */}
              {mode === 'forgot' && (
                <div>
                  <label className="label">Email *</label>
                  <div className="relative"><Mail className="icon" />
                    <input type="email" required autoFocus value={email} onChange={e => { setEmail(e.target.value); clr(); }} placeholder="you@example.com" className={ic} />
                  </div>
                </div>
              )}

              {/* RESET ───────────────────────────────────────────── */}
              {mode === 'reset' && <>
                <div>
                  <label className="label">New Password *</label>
                  <div className="relative"><KeyRound className="icon" />
                    <input type={showNew ? 'text' : 'password'} required autoFocus value={newPw} onChange={e => { setNewPw(e.target.value); clr(); }} placeholder="••••••••" className={ic} />
                    <button type="button" onClick={() => setShowNew(v => !v)} className="abs-eye">{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <PasswordStrength password={newPw} />
                </div>
                <div>
                  <label className="label">Confirm New Password *</label>
                  <div className="relative"><KeyRound className="icon" />
                    <input type={showNewCon ? 'text' : 'password'} required value={newPwCon} onChange={e => { setNewPwCon(e.target.value); clr(); }} placeholder="••••••••" className={`${ic} ${newPwCon ? (newPwCon === newPw ? 'border-green-400' : 'border-red-300') : ''}`} />
                    <button type="button" onClick={() => setShowNewCon(v => !v)} className="abs-eye">{showNewCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
              </>}

              {/* Submit button */}
              {mode === 'forgot' && forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-semibold">Reset link sent! Check your inbox.</p>
                </div>
              ) : (
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/20 mt-2">
                  {busy
                    ? <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    : <>
                        {mode === 'signin_email'     && <><ArrowRight className="h-4 w-4" />Sign In</>}
                        {mode === 'signin_phone'     && <><Phone className="h-4 w-4" />Sign In</>}
                        {mode === 'signup_email'     && <><Mail className="h-4 w-4" />Create Account & Verify Email</>}
                        {mode === 'signup_phone'     && <><Phone className="h-4 w-4" />Create Account & Send OTP</>}
                        {mode === 'signup_phone_otp' && <><CheckCircle2 className="h-4 w-4" />Verify Phone & Continue</>}
                        {mode === 'forgot'           && <><Mail className="h-4 w-4" />Send Reset Link</>}
                        {mode === 'reset'            && <><KeyRound className="h-4 w-4" />Set New Password</>}
                      </>
                  }
                </button>
              )}
            </form>
          )}

          {/* ── Bottom links ─────────────────────────────────────── */}
          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">

            {/* SIGNIN EMAIL links */}
            {mode === 'signin_email' && <>
              <p>
                Don't have an account?{' '}
                <button onClick={toEmailSignup} className="text-primary font-bold hover:underline">Sign up</button>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={toPhoneSignin}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                <Phone className="h-3.5 w-3.5" /> Sign in with Phone Number instead
              </button>
            </>}

            {/* SIGNIN PHONE links */}
            {mode === 'signin_phone' && <>
              <p>
                Don't have an account?{' '}
                <button onClick={toPhoneSignup} className="text-primary font-bold hover:underline">Sign up with phone</button>
              </p>
              <button onClick={toEmailSignin}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                <Mail className="h-3.5 w-3.5" /> Sign in with Email instead
              </button>
            </>}

            {/* SIGNUP EMAIL links */}
            {mode === 'signup_email' && <>
              <p>Already have an account?{' '}
                <button onClick={toEmailSignin} className="text-primary font-bold hover:underline">Sign in</button>
              </p>
              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs">or</span><div className="flex-1 h-px bg-border" /></div>
              <button onClick={toPhoneSignup}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                <Phone className="h-3.5 w-3.5" /> Sign up with Phone Number instead
              </button>
            </>}

            {/* SIGNUP PHONE links */}
            {mode === 'signup_phone' && <>
              <p>Already have an account?{' '}
                <button onClick={toPhoneSignin} className="text-primary font-bold hover:underline">Sign in</button>
              </p>
              <button onClick={toEmailSignup}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all">
                <Mail className="h-3.5 w-3.5" /> Sign up with Email instead
              </button>
            </>}

            {(mode === 'forgot' || mode === 'signup_phone_otp') && (
              <button onClick={() => { setMode('signin_email'); clr(); }} className="text-primary font-bold hover:underline">
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

      {/* Tailwind helpers as inline style (avoids purge issues) */}
      <style>{`
        .label { display:block; margin-bottom:6px; font-size:11px; font-weight:700; color:var(--muted-foreground); text-transform:uppercase; letter-spacing:0.05em; }
        .icon  { position:absolute; left:12px; top:50%; transform:translateY(-50%); height:16px; width:16px; color:var(--muted-foreground); }
        .abs-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--muted-foreground); }
        .abs-eye:hover { color:var(--foreground); }
      `}</style>
    </div>
  );
}