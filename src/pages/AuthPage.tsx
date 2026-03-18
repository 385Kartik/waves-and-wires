import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup' | 'forgot' | 'verify';

const PW_RULES = [
  { label: 'At least 8 characters',      test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)',            test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character',       test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PW_RULES.filter(r => r.test(password)).length;
  const pct    = (passed / PW_RULES.length) * 100;
  const color  = pct <= 40 ? 'bg-red-500' : pct <= 70 ? 'bg-amber-400' : 'bg-green-500';
  const label  = pct <= 40 ? 'Weak' : pct <= 70 ? 'Fair' : pct < 100 ? 'Good' : 'Strong';
  return (
    <div className="mt-2 space-y-2">
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

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }
  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = (value + '      ').slice(0, 6).split('');
    arr[i] = digit;
    onChange(arr.join(''));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }
  function handlePaste(e: React.ClipboardEvent) {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p) { onChange(p.padEnd(6, ' ')); refs.current[Math.min(p.length, 5)]?.focus(); }
    e.preventDefault();
  }
  return (
    <div className="flex gap-2 justify-center">
      {Array(6).fill(0).map((_, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i]?.trim() || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="h-12 w-10 rounded-xl border-2 border-border bg-secondary text-center text-lg font-black text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      ))}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

export default function AuthPage() {
  const { signIn, signUp, resetPassword, sendOtp, verifyOtp, refreshUser, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [mode,        setMode]        = useState<Mode>('signin');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [fullName,    setFullName]    = useState('');
  const [otp,         setOtp]         = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showCon,     setShowCon]     = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState('');
  const [info,        setInfo]        = useState('');
  const [pending,     setPending]     = useState<{ id: string; email: string; name: string } | null>(null);
  const [countdown,   setCountdown]   = useState(0);
  const [forgotSent,  setForgotSent]  = useState(false);

  useEffect(() => { if (!isLoading && user?.email_verified) navigate('/'); }, [user, isLoading]);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const clr = () => { setError(''); setInfo(''); };
  const isStrong = (pw: string) => PW_RULES.every(r => r.test(pw));

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
        setInfo('Redirecting to sign in…');
        setTimeout(() => { setMode('signin'); setEmail(email); clr(); }, 2500);
      } else setError(res.error ?? 'Signup failed.');
      return;
    }
    const userId = res.userId!;
    setPending({ id: userId, email: email.trim(), name: fullName.trim() });
    await supabase.auth.signInWithPassword({ email: email.trim(), password });
    const sent = await sendOtp(userId, email.trim(), fullName.trim());
    await supabase.auth.signOut();
    if (!sent) setError('Account created but verification email failed. Try signing in to resend.');
    setCountdown(60);
    setMode('verify');
  }

  async function handleSignin() {
    clr();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setBusy(true);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (!res.success) return;
    if (res.needsVerification) {
      const { data } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (data?.user) {
        setPending({ id: data.user.id, email: email.trim(), name: data.user.user_metadata?.full_name ?? '' });
        await sendOtp(data.user.id, email.trim(), data.user.user_metadata?.full_name ?? '');
        await supabase.auth.signOut();
        setCountdown(60);
        setMode('verify');
        setInfo('Email not verified yet. We sent a new code.');
      }
      return;
    }
    navigate('/');
  }

  async function handleForgot() {
    clr();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setBusy(true);
    const ok = await resetPassword(email.trim());
    setBusy(false);
    if (ok) { setForgotSent(true); setInfo('Reset link sent! Check your inbox.'); }
  }

  async function handleVerify() {
    clr();
    if (otp.replace(/\s/g, '').length < 6) { setError('Please enter the full 6-digit code.'); return; }
    if (!pending) { setError('Session expired. Please sign in again.'); setMode('signin'); return; }
    setBusy(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: pending.email, password });
    if (authErr) { setBusy(false); setError('Session expired. Please sign in again.'); return; }
    const ok = await verifyOtp(pending.id, otp.replace(/\s/g, ''));
    setBusy(false);
    if (!ok) return;
    await refreshUser();
    navigate('/');
  }

  async function handleResend() {
    if (!pending || countdown > 0) return;
    clr();
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: pending.email, password });
    if (authErr || !data?.user) { setError('Could not resend. Please sign in again.'); return; }
    const sent = await sendOtp(data.user.id, pending.email, pending.name);
    await supabase.auth.signOut();
    if (sent) { setCountdown(60); setInfo('New code sent!'); setOtp(''); }
    else setError('Failed to resend. Please try again.');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signin') handleSignin();
    else if (mode === 'signup') handleSignup();
    else if (mode === 'forgot') handleForgot();
    else if (mode === 'verify') handleVerify();
  }

  const titles: Record<Mode, string> = { signin: 'Welcome Back', signup: 'Create Account', forgot: 'Reset Password', verify: 'Verify Email' };
  const subs: Record<Mode, string>   = {
    signin: 'Sign in to Waves & Wires',
    signup: 'Join us for exclusive deals',
    forgot: "We'll send a reset link",
    verify: `Enter the 6-digit code sent to ${pending?.email ?? 'your email'}`,
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-secondary/30">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm shadow-primary/30">
              <span className="text-sm font-black text-primary-foreground">W&W</span>
            </div>
            <h1 className="text-xl font-black text-foreground">{titles[mode]}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subs[mode]}</p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" required autoFocus value={fullName} onChange={e => { setFullName(e.target.value); clr(); }} placeholder="Rahul Sharma" className={inputCls} />
                </div>
              </div>
            )}

            {mode !== 'verify' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required value={email} onChange={e => { setEmail(e.target.value); clr(); }} placeholder="you@example.com" autoFocus={mode !== 'signup'} className={inputCls} />
                </div>
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPw ? 'text' : 'password'} required minLength={mode === 'signup' ? 8 : 1} value={password} onChange={e => { setPassword(e.target.value); clr(); }} placeholder="••••••••" className={inputCls} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && <PasswordStrength password={password} />}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type={showCon ? 'text' : 'password'} required value={confirm} onChange={e => { setConfirm(e.target.value); clr(); }} placeholder="••••••••"
                    className={`${inputCls} ${confirm ? (confirm === password ? 'border-green-400' : 'border-red-300') : ''}`} />
                  <button type="button" onClick={() => setShowCon(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm && confirm !== password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />Passwords do not match</p>}
                {confirm && confirm === password && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Passwords match</p>}
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-right -mt-1">
                <button type="button" onClick={() => { setMode('forgot'); clr(); }} className="text-xs text-primary hover:underline font-semibold">Forgot password?</button>
              </div>
            )}

            {mode === 'verify' && (
              <div className="space-y-4">
                <OtpInput value={otp} onChange={v => { setOtp(v); clr(); }} />
                <div className="text-center">
                  <button type="button" onClick={handleResend} disabled={countdown > 0}
                    className={`flex items-center gap-1.5 mx-auto text-sm font-semibold ${countdown > 0 ? 'text-muted-foreground cursor-default' : 'text-primary hover:underline'}`}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot' && forgotSent && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                <p className="text-sm font-semibold text-foreground">Check your inbox!</p>
                <p className="text-xs text-muted-foreground">Click the link in the email to reset your password.</p>
              </div>
            )}

            {!(mode === 'forgot' && forgotSent) && (
              <button type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/20 mt-2">
                {busy ? <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : (
                  <>
                    {mode === 'signin'  && <><ArrowRight className="h-4 w-4" />Sign In</>}
                    {mode === 'signup'  && <><User className="h-4 w-4" />Create Account</>}
                    {mode === 'forgot'  && <><Mail className="h-4 w-4" />Send Reset Link</>}
                    {mode === 'verify'  && <><ShieldCheck className="h-4 w-4" />Verify Email</>}
                  </>
                )}
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signin' && <>Don't have an account?{' '}<button onClick={() => { setMode('signup'); clr(); }} className="text-primary font-bold hover:underline">Sign up free</button></>}
            {mode === 'signup' && <>Already have an account?{' '}<button onClick={() => { setMode('signin'); clr(); }} className="text-primary font-bold hover:underline">Sign in</button></>}
            {(mode === 'forgot' || mode === 'verify') && <button onClick={() => { setMode('signin'); clr(); }} className="text-primary font-bold hover:underline">← Back to Sign In</button>}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our <a href="/terms-of-service" className="text-primary hover:underline">Terms</a> &amp; <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}