import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Tag, X, CheckCircle, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendEmail, orderConfirmHtml } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { orderService } from '@/services/order.service';
import { apiClient } from '@/api/client';

type Step = 'address' | 'payment' | 'confirm';
type PayMethod = 'cod' | 'phonepe';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'];

const inputCls = 'w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [step,           setStep]           = useState<Step>('address');
  const [payMethod,      setPayMethod]      = useState<PayMethod>('cod');
  const [placing,        setPlacing]        = useState(false);
  const [couponCode,     setCouponCode]     = useState('');
  const [couponApplied,  setCouponApplied]  = useState<{ code: string; discount: number; id: string } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [address,        setAddress]        = useState(() => {
    try {
      const saved = localStorage.getItem('ww_checkout_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          full_name: parsed.full_name || user?.full_name || '',
          phone: parsed.phone || user?.phone || '',
          address_line_1: parsed.address_line_1 || '',
          address_line_2: parsed.address_line_2 || '',
          city: parsed.city || '',
          state: parsed.state || '',
          postal_code: parsed.postal_code || '',
          country: 'India',
        };
      }
    } catch { /* ignore */ }
    return {
      full_name: user?.full_name ?? '', phone: user?.phone ?? '',
      address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India',
    };
  });

  useEffect(() => {
    try { localStorage.setItem('ww_checkout_address', JSON.stringify(address)); } catch { /* ignore */ }
  }, [address]);

  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        full_name: prev.full_name || user.full_name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const shipping = subtotal > 0 ? 199 : 0;
  const discount = couponApplied?.discount ?? 0;
  const taxBase  = subtotal - discount;
  const tax      = Math.round(taxBase * 0.18);
  const total    = taxBase + shipping + tax;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res: any = await apiClient.post('/coupons/validate', { code: couponCode.toUpperCase().trim() });
      const data = res?.data?.data ?? res?.data;
      if ((!res?.success && !res?.data?.success) || !data) { toast.error('Invalid or expired coupon'); setApplyingCoupon(false); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('This coupon has expired'); setApplyingCoupon(false); return; }
      if (data.usage_limit && data.used_count >= data.usage_limit) { toast.error('Coupon usage limit reached'); setApplyingCoupon(false); return; }
      if (data.min_order_value && subtotal < data.min_order_value) { toast.error(`Min order ₹${data.min_order_value} required`); setApplyingCoupon(false); return; }
      let d = data.discount_type === 'percentage' ? (subtotal * data.discount_value) / 100 : data.discount_value;
      if (data.max_discount) d = Math.min(d, data.max_discount);
      setCouponApplied({ code: data.code, discount: Math.round(d), id: data.id });
      toast.success(`Coupon applied! You save ₹${Math.round(d)}`);
    } catch (err: any) {
      toast.error('Invalid or expired coupon');
    }
    setApplyingCoupon(false);
  }

  function validateAddress() {
    const req = ['full_name','phone','address_line_1','city','state','postal_code'] as const;
    const missing = req.find(k => !address[k]?.trim());
    if (missing) { toast.error(`Please fill: ${missing.replace(/_/g,' ')}`); return false; }
    if (!/^[0-9]{6}$/.test(address.postal_code)) { toast.error('Enter a valid 6-digit postal code'); return false; }
    if (!/^[0-9]{10}$/.test(address.phone.replace(/\D/g,''))) { toast.error('Enter a valid 10-digit phone number'); return false; }
    return true;
  }

  async function saveOrder(paymentMethod: string, paymentStatus: string, paymentRef?: string) {
    const res: any = await orderService.placeOrder({
      p_user_id:          user!.id,
      p_items:            items.map(item => ({
        product_id:    item.product.id,
        quantity:      item.quantity,
        price:         item.product.price,
        product_name:  item.product.name,
        name:          item.product.name,
        product_image: item.product.images?.[0] ?? null,
        image:         item.product.images?.[0] ?? null,
        product_sku:   item.product.sku ?? null,
        sku:           item.product.sku ?? null,
        total:         item.product.price * item.quantity,
      })),
      p_payment_method:   paymentMethod,
      p_payment_status:   paymentStatus,
      p_payment_ref:      paymentRef ?? null,
      p_subtotal:         subtotal,
      p_discount:         discount,
      p_shipping:         shipping,
      p_tax:              tax,
      p_total:            total,
      p_coupon_id:        couponApplied?.id ?? null,
      p_coupon_code:      couponApplied?.code ?? null,
      p_shipping_address: address,
    });
    const result = (res?.data ?? res) as { success?: boolean; error?: string; order_number?: string; id?: string };
    if (!res?.success && !result?.success && !result?.order_number) {
      throw new Error(result?.error ?? res?.message ?? 'Failed to place order');
    }
    return result.order_number || result.id!;
  }

  // Only push COD orders to Shiprocket immediately (payment already guaranteed on delivery).
  // PhonePe orders: pushed by admin AFTER payment_status = 'paid' is confirmed.
  async function pushCodToShiprocket(orderNum: string) {
    try {
      const payload = {
        order_id:        orderNum,
        order_date:      new Date().toISOString().split('T')[0],
        pickup_location: 'Primary',
        billing_customer_name: address.full_name,
        billing_last_name:     '',
        billing_address:       address.address_line_1,
        billing_address_2:     address.address_line_2 || '',
        billing_city:          address.city,
        billing_pincode:       address.postal_code,
        billing_state:         address.state,
        billing_country:       'India',
        billing_email:         user?.email || 'customer@wavesandwires.in',
        billing_phone:         address.phone,
        shipping_is_billing:   true,
        order_items: items.map(item => ({
          name:          item.product.name,
          sku:           item.product.sku || 'SKU-001',
          units:         item.quantity,
          selling_price: item.product.price,
          discount: '', tax: '', hsn: '',
        })),
        payment_method: 'COD',
        sub_total: subtotal,
        length: 10, breadth: 10, height: 10, weight: 0.5,
      };
      const res    = await fetch('/api/shiprocket', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'create_order', payload }),
      });
      const srData = await res.json();
      if (srData.order_id) {
        await apiClient.put(`/orders/${orderNum}`, {
          shiprocket_order_id:    String(srData.order_id),
          shiprocket_shipment_id: srData.shipment_id ? String(srData.shipment_id) : null,
          awb_code:               srData.awb_code    || null,
          courier_name:           srData.courier_name || null,
          status:                 'confirmed',
        });
      }
    } catch (err) {
      console.error('[COD Shiprocket Push] Error:', err);
    }
  }

  // ── COD ──────────────────────────────────────────────────────────────────
  async function placeCOD() {
    if (!user) { toast.error('Sign in first'); navigate('/auth'); return; }
    if (!user.phone_verified && !user.email_verified) {
      toast.error('Please verify your phone number or email before placing orders.');
      navigate('/account');
      return;
    }
    setPlacing(true);
    try {
      const orderNum = await saveOrder('cod', 'pending');
      // COD: push to Shiprocket immediately, payment is on delivery
      await pushCodToShiprocket(orderNum);
      clearCart();
      toast.success('Order placed! Pay on delivery.');
      if (user.email && !user.email.endsWith('@ww.internal')) {
        sendEmail(user.email, `Order Confirmed — ${orderNum}`,
          orderConfirmHtml({ name: address.full_name, orderNum, items, subtotal, discount, shipping, tax, total, paymentMethod: 'cod' }));
      }
      const smsPhone = user.phone || address.phone;
      if (smsPhone) sendSms(smsPhone, 'order_confirm', { orderNum, total });
      navigate(`/order-tracking?order=${orderNum}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to place order');
    } finally { setPlacing(false); }
  }

  // ── PHONEPE ───────────────────────────────────────────────────────────────
  async function placePhonePe() {
    if (!user) { toast.error('Sign in first'); navigate('/auth'); return; }
    if (!user.phone_verified && !user.email_verified) {
      toast.error('Please verify your phone number or email before placing orders.');
      navigate('/account');
      return;
    }
    setPlacing(true);
    try {
      // 1. Save order to DB with status 'pending' — no Shiprocket yet
      const orderNum = await saveOrder('phonepe', 'pending');

      // 2. Initiate PhonePe payment
      const res = await fetch('/api/phonepe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:  'initiate',
          payload: { amount: total, orderNumber: orderNum, phone: address.phone },
        }),
      });
      const data = await res.json();

      if (data.success && data.redirectUrl) {
        // 3. Clear cart and redirect to PhonePe
        // Shiprocket push happens ONLY after payment confirmed (admin panel or webhook)
        clearCart();
        window.location.href = data.redirectUrl;
      } else {
        // Payment initiation failed — cancel the order we just created
        await apiClient.put(`/orders/${orderNum}`, { status: 'cancelled', payment_status: 'failed' });
        toast.error(data.error || 'Payment initiation failed. Redirecting to home...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Payment initiation failed. Redirecting to home...');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setPlacing(false);
    }
  }

  // ── Address step ──────────────────────────────────────────────────────────
  if (step === 'address') {
    return (
      <div className="container py-6 sm:py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 sm:mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-foreground mb-5 sm:mb-6">Delivery Address</h1>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Name *</label>
              <input className={inputCls} value={address.full_name} onChange={e => setAddress(p => ({...p, full_name: e.target.value}))} placeholder="Rahul Sharma" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Phone *</label>
              <input type="tel" inputMode="numeric" maxLength={10} className={inputCls} value={address.phone} onChange={e => setAddress(p => ({...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10)}))} placeholder="9876543210" /></div>
          </div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 1 *</label>
            <input className={inputCls} value={address.address_line_1} onChange={e => setAddress(p => ({...p, address_line_1: e.target.value}))} placeholder="House / Flat / Block No." /></div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Address Line 2</label>
            <input className={inputCls} value={address.address_line_2} onChange={e => setAddress(p => ({...p, address_line_2: e.target.value}))} placeholder="Street, Area, Landmark (optional)" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">City *</label>
              <input className={inputCls} value={address.city} onChange={e => setAddress(p => ({...p, city: e.target.value}))} placeholder="Mumbai" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">State *</label>
              <select className={inputCls} value={address.state} onChange={e => setAddress(p => ({...p, state: e.target.value}))}>
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Pincode *</label>
              <input type="tel" inputMode="numeric" maxLength={6} className={inputCls} value={address.postal_code} onChange={e => setAddress(p => ({...p, postal_code: e.target.value.replace(/\D/g,'').slice(0,6)}))} placeholder="400001" /></div>
          </div>
          <button onClick={() => { if (validateAddress()) setStep('payment'); }}
            className="w-full rounded-full bg-[#ffd814] hover:bg-[#f7ca00] py-3.5 text-sm font-bold text-zinc-900 border border-[#fcd200] shadow-sm transition-all flex items-center justify-center gap-2">
            Continue to Payment <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Payment step ──────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="container py-6 sm:py-8 max-w-2xl">
        <button onClick={() => setStep('address')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 sm:mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Address
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-foreground mb-5 sm:mb-6">Payment Method</h1>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-3">
            {[
              { id: 'phonepe' as PayMethod, icon: CreditCard, label: 'Pay Online', sub: 'UPI, Cards, Net Banking via PhonePe' },
              { id: 'cod'     as PayMethod, icon: Truck,       label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
            ].map(({ id, icon: Icon, label, sub }) => (
              <label key={id} className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                payMethod === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}>
                <input type="radio" name="pay" value={id} checked={payMethod === id} onChange={() => setPayMethod(id)} className="sr-only" />
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  payMethod === id ? 'border-primary' : 'border-border'
                }`}>
                  {payMethod === id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
              </label>
            ))}
          </div>

          {/* Coupon */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Tag className="h-4 w-4" /> Coupon Code</p>
            {couponApplied ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-700 flex-1 truncate">{couponApplied.code} — ₹{couponApplied.discount} off</span>
                <button onClick={() => setCouponApplied(null)} className="text-green-600 hover:text-green-800 shrink-0"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className={`${inputCls} min-w-0 flex-1`} value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" />
                <button onClick={applyCoupon} disabled={applyingCoupon}
                  className="shrink-0 rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50">
                  {applyingCoupon ? '…' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <p className="text-sm font-bold text-foreground">Order Summary</p>
            {[
              { label: 'Subtotal', val: subtotal },
              ...(discount > 0 ? [{ label: 'Discount', val: -discount }] : []),
              { label: 'Shipping', val: shipping },
              { label: 'GST (18%)', val: tax },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-semibold ${val < 0 ? 'text-green-600' : 'text-foreground'}`}>
                  {val < 0 ? '-' : ''}₹{Math.abs(val).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-base font-black border-t border-border pt-2">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={payMethod === 'cod' ? placeCOD : placePhonePe}
            disabled={placing}
            className="w-full rounded-full bg-[#ffd814] hover:bg-[#f7ca00] py-3.5 text-sm font-bold text-zinc-900 border border-[#fcd200] shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {placing ? '…' : payMethod === 'cod' ? '✓ Place Order (COD)' : '🔒 Pay ₹' + total.toLocaleString('en-IN') + ' via PhonePe'}
          </button>

          <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground pt-1 text-center">
            <p>100% Safe &amp; Secure Checkout • Waves and Wires Technologies LLP</p>
            <p>GSTIN: <span className="font-semibold text-foreground">27AACFW7273M1ZI</span></p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}