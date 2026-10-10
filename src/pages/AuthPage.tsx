import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, User, ArrowRight, CheckCircle2,
  AlertCircle, ShieldCheck, Phone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode =
  | 'signin_phone'
  | 'signup_phone'
  | 'phone_otp'
  | 'signin_email'
  | 'signup_email'
  | 'email_otp';

const ic  = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
const icp = "w-full rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

export default function AuthPage() {
  const {
    sendSmsOtp, verifySmsOtp,
    sendEmailOtp, verifyEmailOtp,
    user, isLoading,
  } = useAuth();

  const navigate = useNavigate();

  // Default is Phone Number for Sign In (and Sign Up defaults to Phone too)
  const [mode,     setMode]     = useState<Mode>('signin_phone');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');

  const [fullName, setFullName] = useState('');
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState('');

  const clr = () => { setError(''); setInfo(''); };

  // Auto navigate once logged in
  useEffect(() => {
    if (!isLoading && user) navigate('/');
  }, [user, isLoading]); // eslint-disable-line

  // ── Phone OTP Flow (Sign In & Sign Up) ────────────────────────────────────
  async function handleSendPhoneOtp(isSignup: boolean) {
    clr();
    const digits = phone.replace(/\D/g, '');
    if (isSignup && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (digits.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setBusy(true);
    const sent = await sendSmsOtp(digits);
    setBusy(false);
    if (sent) {
      setOtp('');
      setMode('phone_otp');
    }
  }

  async function handleVerifyPhoneOtp() {
    clr();
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP sent to your mobile number.');
      return;
    }
    setBusy(true);
    const ok = await verifySmsOtp(phone, otp.trim(), undefined, fullName.trim() || undefined);
    setBusy(false);
    if (ok) navigate('/');
  }

  // ── Email OTP Flow (Sign In & Sign Up) ────────────────────────────────────
  async function handleSendEmailOtp(isSignup: boolean) {
    clr();
    if (isSignup && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    const sent = await sendEmailOtp(email.trim());
    setBusy(false);
    if (sent) {
      setOtp('');
      setMode('email_otp');
    }
  }

  async function handleVerifyEmailOtp() {
    clr();
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP sent to your email.');
      return;
    }
    setBusy(true);
    const ok = await verifyEmailOtp(otp.trim(), email.trim(), fullName.trim() || undefined);
    setBusy(false);
    if (ok) navigate('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signin_phone') return handleSendPhoneOtp(false);
    if (mode === 'signup_phone') return handleSendPhoneOtp(true);
    if (mode === 'phone_otp')    return handleVerifyPhoneOtp();
    if (mode === 'signin_email') return handleSendEmailOtp(false);
    if (mode === 'signup_email') return handleSendEmailOtp(true);
    if (mode === 'email_otp')    return handleVerifyEmailOtp();
  }

  // ── Mode switch helpers (Phone is default for both Sign In and Sign Up) ───
  function toPhoneSignin() { setMode('signin_phone'); clr(); setOtp(''); }
  function toPhoneSignup() { setMode('signup_phone'); clr(); setOtp(''); }
  function toEmailSignin() { setMode('signin_email'); clr(); setOtp(''); }
  function toEmailSignup() { setMode('signup_email'); clr(); setOtp(''); }

  const titles: Record<Mode, string> = {
    signin_phone: 'Sign In with Phone',
    signup_phone: 'Sign Up with Phone',
    phone_otp:    'Verify Your Phone',
    signin_email: 'Sign In with Email',
    signup_email: 'Sign Up with Email',
    email_otp:    'Verify Your Email',
  };

  const subs: Record<Mode, string> = {
    signin_phone: 'Enter your mobile number to receive a 6-digit OTP',
    signup_phone: 'Create your account using mobile OTP',
    phone_otp:    `6-digit OTP sent to +91 ${phone} via SMS`,
    signin_email: 'Enter your email address to receive a 6-digit OTP',
    signup_email: 'Create your account using email OTP',
    email_otp:    `6-digit OTP sent to ${email}`,
  };

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

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── SIGN IN WITH PHONE (DEFAULT) ──────────────────────────── */}
            {mode === 'signin_phone' && (
              <div>
                <label className="label">Mobile Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    autoFocus
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); clr(); }}
                    placeholder="9876543210"
                    className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  We'll send a one-time verification code via SMS
                </p>
              </div>
            )}

            {/* ── SIGN UP WITH PHONE (DEFAULT SIGN UP) ──────────────────── */}
            {mode === 'signup_phone' && (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User className="icon" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={fullName}
                      onChange={e => { setFullName(e.target.value); clr(); }}
                      placeholder="Rahul Sharma"
                      className={ic}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Mobile Number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); clr(); }}
                      placeholder="9876543210"
                      className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    OTP will be sent to this number via SMS
                  </p>
                </div>
              </>
            )}

            {/* ── VERIFY PHONE OTP ──────────────────────────────────────── */}
            {mode === 'phone_otp' && (
              <>
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-700">
                  📱 Check SMS on +91 {phone} for your 6-digit OTP
                </div>
                <div>
                  <label className="label">Enter 6-Digit SMS OTP *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); clr(); }}
                    placeholder="• • • • • •"
                    className={`${icp} text-center tracking-[0.6em] font-bold text-xl`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => { setBusy(true); sendSmsOtp(phone).finally(() => setBusy(false)); }}
                    className="text-primary hover:underline font-semibold"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={toPhoneSignin}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Change mobile number →
                  </button>
                </div>
              </>
            )}

            {/* ── SIGN IN WITH EMAIL ────────────────────────────────────── */}
            {mode === 'signin_email' && (
              <div>
                <label className="label">Email Address *</label>
                <div className="relative">
                  <Mail className="icon" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => { setEmail(e.target.value); clr(); }}
                    placeholder="you@example.com"
                    className={ic}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  We'll send a 6-digit OTP to your email inbox
                </p>
              </div>
            )}

            {/* ── SIGN UP WITH EMAIL ────────────────────────────────────── */}
            {mode === 'signup_email' && (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User className="icon" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={fullName}
                      onChange={e => { setFullName(e.target.value); clr(); }}
                      placeholder="Rahul Sharma"
                      className={ic}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <div className="relative">
                    <Mail className="icon" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); clr(); }}
                      placeholder="you@example.com"
                      className={ic}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    OTP will be sent to this email address
                  </p>
                </div>
              </>
            )}

            {/* ── VERIFY EMAIL OTP ──────────────────────────────────────── */}
            {mode === 'email_otp' && (
              <>
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-xs text-green-700">
                  📧 Check your inbox ({email}) for your 6-digit verification OTP.
                </div>
                <div>
                  <label className="label">Enter 6-Digit Email OTP *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); clr(); }}
                    placeholder="• • • • • •"
                    className={`${icp} text-center tracking-[0.6em] font-bold text-xl`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => { setBusy(true); sendEmailOtp(email).finally(() => setBusy(false)); }}
                    className="text-primary hover:underline font-semibold"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={toEmailSignin}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Change email address →
                  </button>
                </div>
              </>
            )}

            {/* ── SUBMIT BUTTON ─────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/20 mt-2"
            >
              {busy ? (
                <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                <>
                  {mode === 'signin_phone' && <><Phone className="h-4 w-4" />Send OTP</>}
                  {mode === 'signup_phone' && <><Phone className="h-4 w-4" />Send OTP</>}
                  {mode === 'phone_otp'    && <><CheckCircle2 className="h-4 w-4" />Verify OTP & Continue</>}
                  {mode === 'signin_email' && <><Mail className="h-4 w-4" />Send OTP</>}
                  {mode === 'signup_email' && <><Mail className="h-4 w-4" />Send OTP</>}
                  {mode === 'email_otp'    && <><CheckCircle2 className="h-4 w-4" />Verify OTP & Continue</>}
                </>
              )}
            </button>
          </form>

          {/* ── Bottom Switch Links ────────────────────────────────────── */}
          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">

            {/* SIGNIN PHONE links */}
            {mode === 'signin_phone' && (
              <>
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={toPhoneSignup} className="text-primary font-bold hover:underline">
                    Sign up
                  </button>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={toEmailSignin}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
                >
                  <Mail className="h-3.5 w-3.5" /> Sign in with Email OTP instead
                </button>
              </>
            )}

            {/* SIGNUP PHONE links */}
            {mode === 'signup_phone' && (
              <>
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={toPhoneSignin} className="text-primary font-bold hover:underline">
                    Sign in
                  </button>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={toEmailSignup}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
                >
                  <Mail className="h-3.5 w-3.5" /> Sign up with Email OTP instead
                </button>
              </>
            )}

            {/* SIGNIN EMAIL links */}
            {mode === 'signin_email' && (
              <>
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={toPhoneSignup} className="text-primary font-bold hover:underline">
                    Sign up with Phone
                  </button>
                  {' · '}
                  <button type="button" onClick={toEmailSignup} className="text-primary font-bold hover:underline">
                    Email
                  </button>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={toPhoneSignin}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
                >
                  <Phone className="h-3.5 w-3.5" /> Sign in with Phone Number (Recommended)
                </button>
              </>
            )}

            {/* SIGNUP EMAIL links */}
            {mode === 'signup_email' && (
              <>
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={toPhoneSignin} className="text-primary font-bold hover:underline">
                    Sign in
                  </button>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={toPhoneSignup}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
                >
                  <Phone className="h-3.5 w-3.5" /> Sign up with Phone Number (Recommended)
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="/terms-of-service" className="text-primary hover:underline">Terms</a> &amp;{' '}
          <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>

      <style>{`
        .label { display:block; margin-bottom:6px; font-size:11px; font-weight:700; color:var(--muted-foreground); text-transform:uppercase; letter-spacing:0.05em; }
        .icon  { position:absolute; left:12px; top:50%; transform:translateY(-50%); height:16px; width:16px; color:var(--muted-foreground); }
      `}</style>
    </div>
  );
}