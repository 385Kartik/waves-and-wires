import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, LogOut, Package, Edit2, Check, X,
  Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Plus,
} from 'lucide-react';
import { useAuth, normalisePhone, phoneToInternalEmail } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function AccountPage() {
  const {
    user, signOut, updateProfile,
    sendEmailOtp, verifyEmailOtp,
    sendSmsOtp, verifySmsOtp,
  } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);

  // ── Name ──────────────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState(user?.full_name ?? '');

  // ── Email ─────────────────────────────────────────────────────────────────
  const [emailStep,   setEmailStep]   = useState<'view' | 'edit' | 'otp'>('view');
  const [emailVal,    setEmailVal]    = useState('');
  const [emailOtp,    setEmailOtp]    = useState('');
  const [emailBusy,   setEmailBusy]   = useState(false);

  // ── Phone ─────────────────────────────────────────────────────────────────
  const [phoneStep,      setPhoneStep]      = useState<'view' | 'edit' | 'otp'>('view');
  const [phoneVal,       setPhoneVal]       = useState('');
  const [phoneOtp,       setPhoneOtp]       = useState('');
  const [phoneBusy,      setPhoneBusy]      = useState(false);

  // ── Change password ───────────────────────────────────────────────────────
  const [changingPw,  setChangingPw]  = useState(false);
  const [oldPw,       setOldPw]       = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [newPwCon,    setNewPwCon]    = useState('');
  const [pwBusy,      setPwBusy]      = useState(false);
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showNewCon,  setShowNewCon]  = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    setNameVal(user.full_name);
    supabase.from('orders').select('*, order_items(id)').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  if (!user) return null;

  const bothVerified = user.email_verified && user.phone_verified;
  const hasEmail     = Boolean(user.email);
  const hasPhone     = Boolean(user.phone);

  // ── Name ──────────────────────────────────────────────────────────────────
  async function saveName() {
    const ok = await updateProfile({ full_name: nameVal });
    if (ok) setEditingName(false);
  }

  // ── Email: save + send OTP ─────────────────────────────────────────────────
  async function handleEmailSave() {
    if (!emailVal.trim().includes('@')) { toast.error('Enter a valid email'); return; }
    setEmailBusy(true);
    const ok = await sendEmailOtp(emailVal.trim().toLowerCase());
    setEmailBusy(false);
    if (ok) { setEmailStep('otp'); setEmailOtp(''); }
  }

  // ── Email: verify OTP ──────────────────────────────────────────────────────
  async function handleEmailVerify() {
    if (emailOtp.trim().length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setEmailBusy(true);
    const ok = await verifyEmailOtp(emailOtp);
    setEmailBusy(false);
    if (ok) { setEmailStep('view'); setEmailVal(''); setEmailOtp(''); }
  }

  // ── Phone: save + send OTP ─────────────────────────────────────────────────
  async function handlePhoneSave() {
    const digits = phoneVal.replace(/\D/g, '');
    if (digits.length < 10) { toast.error('Enter a valid 10-digit number'); return; }
    const formatted = normalisePhone(phoneVal);
    setPhoneBusy(true);
    // Save to profile first
    await supabase.from('profiles').update({ phone: formatted, phone_verified: false }).eq('id', user.id);
    const ok = await sendSmsOtp(formatted);
    setPhoneBusy(false);
    if (ok) { setPhoneStep('otp'); setPhoneOtp(''); }
  }

  // ── Phone: verify OTP ─────────────────────────────────────────────────────
  async function handlePhoneVerify() {
    if (phoneOtp.trim().length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    const formatted = normalisePhone(phoneVal || user.phone || '');
    setPhoneBusy(true);
    const ok = await verifySmsOtp(formatted, phoneOtp);
    setPhoneBusy(false);
    if (ok) { setPhoneStep('view'); setPhoneVal(''); setPhoneOtp(''); }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function changePassword() {
    if (!oldPw || !newPw) { toast.error('Fill all fields'); return; }
    if (newPw.length < 8)  { toast.error('Min 8 characters'); return; }
    if (newPw !== newPwCon) { toast.error('Passwords do not match'); return; }
    setPwBusy(true);
    // Phone signup users ke liye internal email use karo re-auth mein
    const authEmail = user.is_phone_signup && user.phone
      ? phoneToInternalEmail(user.phone)
      : user.email;
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: oldPw });
    if (signInErr) { toast.error('Current password is incorrect'); setPwBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated!');
    setChangingPw(false); setOldPw(''); setNewPw(''); setNewPwCon('');
  }

  const inputCls   = "flex-1 rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const pwInputCls = "w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all";
  const otpInputCls = "w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-center tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-green-400";

  return (
    <div className="container py-8 sm:py-10 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6 sm:mb-8">My Account</h1>

      {/* ── Verification banner ─────────────────────────────────────────── */}
      {!bothVerified && (
        <div className={`mb-6 rounded-2xl border px-5 py-4 flex items-start gap-3 ${
          !hasEmail || !hasPhone ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${!hasEmail || !hasPhone ? 'text-red-500' : 'text-amber-500'}`} />
          <div>
            <p className={`text-sm font-bold ${!hasEmail || !hasPhone ? 'text-red-700' : 'text-amber-700'}`}>
              {!hasEmail ? 'Add & verify email to place orders'
               : !hasPhone ? 'Add & verify phone number to place orders'
               : 'Complete verification to place orders'}
            </p>
            <p className={`text-xs mt-0.5 ${!hasEmail || !hasPhone ? 'text-red-600' : 'text-amber-600'}`}>
              Both a verified email and phone number are required.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        {/* ── Profile card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {(user.full_name || user.email || user.phone || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-foreground">{user.full_name || 'No Name'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {bothVerified
                  ? <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-xs text-green-600 font-semibold">Fully Verified</span></>
                  : <><AlertCircle className="h-3 w-3 text-amber-500" /><span className="text-xs text-amber-600">Verification Pending</span></>
                }
              </div>
            </div>
          </div>

          {/* ── EMAIL ────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>

            {/* VIEW */}
            {emailStep === 'view' && (
              hasEmail ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary border border-input text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 text-foreground">{user.email}</span>
                    {user.email_verified
                      ? <span className="flex items-center gap-1 text-xs font-bold text-green-600 shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>
                      : <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0"><AlertCircle className="h-3.5 w-3.5" /> Unverified</span>
                    }
                    <button
                      onClick={() => { setEmailStep('edit'); setEmailVal(user.email); }}
                      className="text-muted-foreground hover:text-foreground ml-1 shrink-0">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!user.email_verified && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-3 space-y-2">
                      <p className="text-xs text-amber-700">Verify your email to place orders.</p>
                      <button
                        onClick={() => { setEmailStep('edit'); setEmailVal(user.email); }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900">
                        Send verification OTP →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-3">
                    <p className="text-xs text-red-700 font-semibold">No email added yet</p>
                    <p className="text-xs text-red-600 mt-0.5">Required for order confirmations.</p>
                  </div>
                  <button
                    onClick={() => { setEmailStep('edit'); setEmailVal(''); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80">
                    <Plus className="h-3.5 w-3.5" /> Add Email Address
                  </button>
                </div>
              )
            )}

            {/* EDIT */}
            {emailStep === 'edit' && (
              <div className="space-y-2">
                <input
                  type="email" autoFocus value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-secondary/60 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                <div className="flex gap-2">
                  <button
                    onClick={handleEmailSave} disabled={emailBusy}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold py-2 hover:bg-primary/90 disabled:opacity-50">
                    <Mail className="h-3.5 w-3.5" />
                    {emailBusy ? 'Sending OTP…' : 'Send OTP to verify'}
                  </button>
                  <button
                    onClick={() => { setEmailStep('view'); setEmailVal(''); }}
                    className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground hover:bg-accent">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* OTP */}
            {emailStep === 'otp' && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-3 space-y-3">
                <p className="text-xs text-green-700 font-semibold">📧 OTP sent to {emailVal || user.email}</p>
                <input
                  type="text" inputMode="numeric" maxLength={6} autoFocus
                  value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className={otpInputCls} />
                <div className="flex gap-2">
                  <button
                    onClick={handleEmailVerify} disabled={emailBusy || emailOtp.length !== 6}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white text-xs font-bold py-2 hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {emailBusy ? 'Verifying…' : 'Confirm OTP'}
                  </button>
                  <button
                    onClick={() => { setEmailStep('view'); setEmailOtp(''); }}
                    className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground hover:bg-accent">
                    Cancel
                  </button>
                </div>
                <button
                  onClick={handleEmailSave} disabled={emailBusy}
                  className="text-xs text-green-700 hover:underline disabled:opacity-60">
                  Resend OTP
                </button>
              </div>
            )}
          </div>

          {/* ── FULL NAME ─────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input value={nameVal} onChange={e => setNameVal(e.target.value)} className={inputCls} autoFocus />
                <button onClick={saveName} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"><Check className="h-4 w-4" /></button>
                <button onClick={() => { setEditingName(false); setNameVal(user.full_name); }} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary border border-input">
                <span className="text-sm text-foreground">{user.full_name || '—'}</span>
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>

          {/* ── PHONE ─────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>

            {/* VIEW */}
            {phoneStep === 'view' && (
              hasPhone ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary border border-input text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-foreground">{user.phone}</span>
                    {user.phone_verified
                      ? <span className="flex items-center gap-1 text-xs font-bold text-green-600 shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>
                      : <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0"><AlertCircle className="h-3.5 w-3.5" /> Unverified</span>
                    }
                    <button
                      onClick={() => { setPhoneStep('edit'); setPhoneVal(user.phone?.replace('+91', '') ?? ''); }}
                      className="text-muted-foreground hover:text-foreground ml-1 shrink-0">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!user.phone_verified && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-3 space-y-2">
                      <p className="text-xs text-amber-700">Verify your phone to place orders.</p>
                      <button
                        onClick={() => { setPhoneStep('edit'); setPhoneVal(user.phone?.replace('+91', '') ?? ''); }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900">
                        Send verification OTP →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-3">
                    <p className="text-xs text-red-700 font-semibold">No phone number added yet</p>
                    <p className="text-xs text-red-600 mt-0.5">Required to place orders.</p>
                  </div>
                  <button
                    onClick={() => { setPhoneStep('edit'); setPhoneVal(''); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80">
                    <Plus className="h-3.5 w-3.5" /> Add Phone Number
                  </button>
                </div>
              )
            )}

            {/* EDIT */}
            {phoneStep === 'edit' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-semibold shrink-0">🇮🇳 +91</div>
                  <input
                    type="tel" inputMode="numeric" maxLength={10} autoFocus
                    value={phoneVal} onChange={e => setPhoneVal(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="flex-1 rounded-xl border border-border bg-secondary/60 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePhoneSave} disabled={phoneBusy}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold py-2 hover:bg-primary/90 disabled:opacity-50">
                    <Phone className="h-3.5 w-3.5" />
                    {phoneBusy ? 'Sending OTP…' : 'Send OTP to verify'}
                  </button>
                  <button
                    onClick={() => { setPhoneStep('view'); setPhoneVal(''); }}
                    className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground hover:bg-accent">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* OTP */}
            {phoneStep === 'otp' && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-3 space-y-3">
                <p className="text-xs text-green-700 font-semibold">📱 OTP sent to +91 {phoneVal}</p>
                <input
                  type="text" inputMode="numeric" maxLength={6} autoFocus
                  value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className={otpInputCls} />
                <div className="flex gap-2">
                  <button
                    onClick={handlePhoneVerify} disabled={phoneBusy || phoneOtp.length !== 6}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white text-xs font-bold py-2 hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {phoneBusy ? 'Verifying…' : 'Confirm OTP'}
                  </button>
                  <button
                    onClick={() => { setPhoneStep('view'); setPhoneOtp(''); }}
                    className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground hover:bg-accent">
                    Cancel
                  </button>
                </div>
                <button
                  onClick={handlePhoneSave} disabled={phoneBusy}
                  className="text-xs text-green-700 hover:underline disabled:opacity-60">
                  Resend OTP
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Member since {format(new Date(user.created_at), 'MMMM yyyy')}
          </p>

          {/* ── Change Password ─────────────────────────────────────────── */}
          <div className="space-y-3 pt-2 border-t border-border">
            <button
              onClick={() => { setChangingPw(v => !v); setOldPw(''); setNewPw(''); setNewPwCon(''); }}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <KeyRound className="h-4 w-4" />{changingPw ? 'Cancel' : 'Change Password'}
            </button>

            {changingPw && (
              <div className="space-y-3 pt-1">
                {[
                  { val: oldPw, set: setOldPw, show: showOld, setShow: setShowOld, ph: 'Current password', match: null },
                  { val: newPw, set: setNewPw, show: showNew, setShow: setShowNew, ph: 'New password (min 8 chars)', match: null },
                  { val: newPwCon, set: setNewPwCon, show: showNewCon, setShow: setShowNewCon, ph: 'Confirm new password', match: newPwCon ? newPwCon === newPw : null },
                ].map(({ val, set, show, setShow, ph, match }, i) => (
                  <div key={i} className="relative">
                    <input
                      type={show ? 'text' : 'password'} value={val}
                      onChange={e => set(e.target.value)} placeholder={ph}
                      className={`${pwInputCls} ${match === true ? 'border-green-400' : match === false ? 'border-red-300' : ''}`} />
                    <button type="button" onClick={() => setShow((v: boolean) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
                {newPwCon && newPwCon !== newPw && <p className="text-xs text-red-500">Passwords do not match</p>}
                <button
                  onClick={changePassword} disabled={pwBusy}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all">
                  <Lock className="h-3.5 w-3.5" />{pwBusy ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors">
            <LogOut className="h-4 w-4" />Sign Out
          </button>
        </div>

        {/* ── Recent Orders ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">Recent Orders</h2>
            <Link to="/order-tracking?tab=myorders" className="text-xs text-primary font-semibold hover:underline">View all →</Link>
          </div>

          {!bothVerified && (
            <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3 text-xs text-muted-foreground">
              🔒 Verify both email and phone to place orders.
            </div>
          )}

          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              {bothVerified && <Link to="/shop" className="text-xs font-semibold text-primary hover:underline">Browse Products</Link>}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <Link key={o.id} to={`/order-tracking?order=${o.order_number}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/20 transition-all">
                  <div>
                    <p className="text-xs font-bold text-foreground">#{o.order_number}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(o.created_at), 'dd MMM yyyy')}</p>
                    <p className="text-[10px] text-muted-foreground">{o.order_items?.length ?? 0} item{o.order_items?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{INR(o.total)}</p>
                    <span className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded-full ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}