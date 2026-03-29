import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Shield, LogOut, Package, Edit2, Check, X, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function AccountPage() {
  const { user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [orders,        setOrders]        = useState<any[]>([]);
  const [editingName,   setEditingName]   = useState(false);
  const [editingPhone,  setEditingPhone]  = useState(false);
  const [nameVal,       setNameVal]       = useState(user?.full_name ?? '');
  const [phoneVal,      setPhoneVal]      = useState(user?.phone ?? '');

  // Change password
  const [changingPw, setChangingPw] = useState(false);
  const [oldPw,      setOldPw]      = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [newPwCon,   setNewPwCon]   = useState('');
  const [pwBusy,     setPwBusy]     = useState(false);
  const [showOld,    setShowOld]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showNewCon, setShowNewCon] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    supabase.from('orders').select('*, order_items(id)').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  if (!user) return null;

  async function saveName() {
    const ok = await updateProfile({ full_name: nameVal });
    if (ok) setEditingName(false);
  }

  async function savePhone() {
    const ok = await updateProfile({ phone: phoneVal });
    if (ok) setEditingPhone(false);
  }

  async function changePassword() {
    if (!oldPw || !newPw) { toast.error('Please fill all fields'); return; }
    if (newPw.length < 8)  { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== newPwCon) { toast.error('Passwords do not match'); return; }
    setPwBusy(true);
    // Verify old password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
    if (signInErr) { toast.error('Current password is incorrect'); setPwBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully!');
    setChangingPw(false); setOldPw(''); setNewPw(''); setNewPwCon('');
  }

  const inputCls     = "flex-1 rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const pwInputCls   = "w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all";

  return (
    <div className="container py-8 sm:py-10 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-6 sm:mb-8">My Account</h1>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-foreground">{user.full_name || 'No Name'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className={`h-3 w-3 ${user.email_verified ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={`text-xs ${user.email_verified ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {user.email_verified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary border border-input text-sm text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input value={nameVal} onChange={e => setNameVal(e.target.value)} className={inputCls} autoFocus />
                <button onClick={saveName} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => { setEditingName(false); setNameVal(user.full_name ?? ''); }} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-accent transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary border border-input">
                <span className="text-sm text-foreground">{user.full_name || '—'}</span>
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>
            {editingPhone ? (
              <div className="flex items-center gap-2">
                <input value={phoneVal} onChange={e => setPhoneVal(e.target.value)} type="tel" className={inputCls} autoFocus />
                <button onClick={savePhone} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => { setEditingPhone(false); setPhoneVal(user.phone ?? ''); }} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-accent transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary border border-input">
                <span className="text-sm text-foreground">{user.phone || '—'}</span>
                <button onClick={() => setEditingPhone(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Member since {format(new Date(user.created_at), 'MMMM yyyy')}
          </p>

          {/* Change Password */}
          <div className="space-y-3 pt-2 border-t border-border">
            <button
              onClick={() => { setChangingPw(v => !v); setOldPw(''); setNewPw(''); setNewPwCon(''); }}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <KeyRound className="h-4 w-4" />
              {changingPw ? 'Cancel' : 'Change Password'}
            </button>

            {changingPw && (
              <div className="space-y-3 pt-1">
                {/* Old password */}
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPw}
                    onChange={e => setOldPw(e.target.value)}
                    placeholder="Current password"
                    className={pwInputCls}
                  />
                  <button type="button" onClick={() => setShowOld(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* New password */}
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className={pwInputCls}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Confirm new password */}
                <div className="relative">
                  <input
                    type={showNewCon ? 'text' : 'password'}
                    value={newPwCon}
                    onChange={e => setNewPwCon(e.target.value)}
                    placeholder="Confirm new password"
                    className={`${pwInputCls} ${newPwCon ? (newPwCon === newPw ? 'border-green-400' : 'border-red-300') : ''}`}
                  />
                  <button type="button" onClick={() => setShowNewCon(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {newPwCon && newPwCon !== newPw && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}

                <button
                  onClick={changePassword}
                  disabled={pwBusy}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all">
                  <Lock className="h-3.5 w-3.5" />
                  {pwBusy ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors">
            <LogOut className="h-4 w-4" />Sign Out
          </button>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">Recent Orders</h2>
            <Link to="/order-tracking?tab=myorders" className="text-xs text-primary font-semibold hover:underline">View all →</Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <Link to="/shop" className="text-xs font-semibold text-primary hover:underline">Browse Products</Link>
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
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
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