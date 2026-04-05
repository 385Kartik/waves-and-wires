import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Tag, X, CheckCircle, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { sendEmail, orderConfirmHtml } from '@/lib/email';
import { sendSms, orderConfirmSms } from '@/lib/sms';

type Step = 'address' | 'payment' | 'confirm';
type PayMethod = 'cod' | 'phonepe';   // razorpay → phonepe

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
  const [address,        setAddress]        = useState({
    full_name: user?.full_name ?? '', phone: user?.phone ?? '',
    address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India',
  });

  const shipping = subtotal >= 999 ? 0 : 99;
  const discount = couponApplied?.discount ?? 0;
  const taxBase  = subtotal - discount;
  const tax      = Math.round(taxBase * 0.18);
  const total    = taxBase + shipping + tax;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await supabase.from('coupons').select('*')
      .eq('code', couponCode.toUpperCase().trim()).eq('is_active', true).single();
    setApplyingCoupon(false);
    if (error || !data) { toast.error('Invalid or expired coupon'); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('This coupon has expired'); return; }
    if (data.usage_limit && data.used_count >= data.usage_limit) { toast.error('Coupon usage limit reached'); return; }
    if (data.min_order_value && subtotal < data.min_order_value) { toast.error(`Min order ₹${data.min_order_value} required`); return; }
    let d = data.discount_type === 'percentage' ? (subtotal * data.discount_value) / 100 : data.discount_value;
    if (data.max_discount) d = Math.min(d, data.max_discount);
    setCouponApplied({ code: data.code, discount: Math.round(d), id: data.id });
    toast.success(`Coupon applied! You save ₹${Math.round(d)}`);
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
    const { data, error } = await supabase.rpc('place_order', {
      p_user_id:          user!.id,
      p_items:            items.map(item => ({
        product_id: item.product.id, quantity: item.quantity,
        price: item.product.price, name: item.product.name,
        image: item.product.images?.[0] ?? null, sku: item.product.sku ?? null,
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
    if (error) throw new Error(error.message);
    const result = data as { success: boolean; error?: string; order_number?: string };
    if (!result.success) throw new Error(result.error ?? 'Failed to place order');
    return result.order_number!;
  }

  async function autoPushToShiprocket(orderNum: string) {
    try {
      const payload = {
        order_id:       orderNum,
        order_date:     new Date().toISOString().split('T')[0],
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
        payment_method: payMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total:  subtotal,
        length: 10, breadth: 10, height: 10, weight: 0.5,
      };
      const res    = await fetch('/api/shiprocket', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'create_order', payload }),
      });
      const srData = await res.json();
      if (srData.order_id) {
        await supabase.from('orders').update({
          shiprocket_order_id:    String(srData.order_id),
          shiprocket_shipment_id: srData.shipment_id ? String(srData.shipment_id) : null,
          awb_code:               srData.awb_code    || null,
          courier_name:           srData.courier_name || null,
          status:                 'confirmed',
        }).eq('order_number', orderNum);
      }
    } catch (err) {
      console.error('[AutoPush] Shiprocket push exception:', err);
    }
  }

  // ── COD ──────────────────────────────────────────────────────────────────
  async function placeCOD() {
    if (!user) { toast.error('Sign in first'); navigate('/auth'); return; }
    if (!user.email_verified || !user.phone_verified) {
      toast.error('Please verify both email and phone before placing orders.');
      navigate('/account');
      return;
    }
    setPlacing(true);
    try {
      const orderNum = await saveOrder('cod', 'pending');
      await autoPushToShiprocket(orderNum);
      clearCart();
      toast.success('Order placed! Pay on delivery.');
      sendEmail(user.email, `Order Confirmed — ${orderNum}`,
        orderConfirmHtml({ name: address.full_name, orderNum, items, subtotal, discount, shipping, tax, total, paymentMethod: 'cod' }));
      if (user.phone) sendSms(user.phone, orderConfirmSms(orderNum, total, user.full_name));
      navigate(`/order-tracking?order=${orderNum}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to place order');
    } finally { setPlacing(false); }
  }

  // ── PHONEPE ───────────────────────────────────────────────────────────────
  async function placePhonePe() {
    if (!user) { toast.error('Sign in first'); navigate('/auth'); return; }
    if (!user.email_verified || !user.phone_verified) {
      toast.error('Please verify both email and phone before placing orders.');
      navigate('/account');
      return;
    }
    setPlacing(true);
    try {
      // 1. Order DB mein save karo (payment_pending)
      const orderNum = await saveOrder('phonepe', 'pending');

      // 2. Shiprocket ko push karo (async — wait nahi)
      autoPushToShiprocket(orderNum);

      // 3. PhonePe payment initiate karo
      const res = await fetch('/api/phonepe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:  'initiate',
          payload: {
            amount:      total,
            orderNumber: orderNum,
            phone:       address.phone,
          },
        }),
      });
      const data = await res.json();

      if (data.success && data.redirectUrl) {
        clearCart();
        // PhonePe payment page pe redirect
        window.location.href = data.redirectUrl;
      } else {
        toast.error(data.error || 'PhonePe initiation failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Payment initiation failed');
    } finally { setPlacing(false); }
  }

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-24">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Your cart is empty</h1>
        <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">Browse Products</Link>
      </div>
    );
  }

  const STEPS = [
    { key: 'address', label: 'Address' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirm', label: 'Review' },
  ] as const;

  return (
    <div className="container py-6 sm:py-8 max-w-5xl">
      <h1 className="text-xl sm:text-2xl font-black text-foreground mb-5 sm:mb-6">Checkout</h1>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8">
        {STEPS.map((s, i) => {
          const idx  = STEPS.findIndex(x => x.key === step);
          const done = i < idx;
          const curr = s.key === step;
          return (
            <div key={s.key} className="flex items-center gap-1.5 sm:gap-2 flex-1 last:flex-none">
              <div className={`flex items-center gap-1.5 sm:gap-2 ${done ? 'cursor-pointer' : ''}`}
                onClick={() => done && setStep(s.key)}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${done ? 'bg-green-500 text-white' : curr ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs sm:text-sm font-semibold ${curr ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${done ? 'bg-green-400' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* STEP 1: Address */}
          {step === 'address' && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <h2 className="font-bold text-foreground mb-4 sm:mb-5">Shipping Address</h2>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
                  <input value={address.full_name} onChange={e=>setAddress(a=>({...a,full_name:e.target.value}))} className={inputCls} placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Phone *</label>
                  <input type="tel" value={address.phone} onChange={e=>setAddress(a=>({...a,phone:e.target.value}))} className={inputCls} placeholder="9876543210" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Postal Code *</label>
                  <input value={address.postal_code} onChange={e=>setAddress(a=>({...a,postal_code:e.target.value}))} className={inputCls} placeholder="400001" maxLength={6} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Address Line 1 *</label>
                  <input value={address.address_line_1} onChange={e=>setAddress(a=>({...a,address_line_1:e.target.value}))} className={inputCls} placeholder="House/Flat No., Street Name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Address Line 2 <span className="font-normal">(optional)</span></label>
                  <input value={address.address_line_2} onChange={e=>setAddress(a=>({...a,address_line_2:e.target.value}))} className={inputCls} placeholder="Landmark, Area" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">City *</label>
                  <input value={address.city} onChange={e=>setAddress(a=>({...a,city:e.target.value}))} className={inputCls} placeholder="Mumbai" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">State *</label>
                  <select value={address.state} onChange={e=>setAddress(a=>({...a,state:e.target.value}))} className={inputCls}>
                    <option value="">Select State</option>
                    {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { if (validateAddress()) setStep('payment'); }}
                className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-6 sm:px-8 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all w-full sm:w-auto justify-center sm:justify-start">
                Continue to Payment <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <h2 className="font-bold text-foreground mb-4 sm:mb-5">Payment Method</h2>
              <div className="space-y-3">

                {/* COD */}
                <label className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${payMethod==='cod'?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
                  <input type="radio" name="pay" value="cod" checked={payMethod==='cod'} onChange={()=>setPayMethod('cod')} className="accent-primary" />
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><Truck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" /></div>
                    <div><p className="font-bold text-foreground text-sm">Cash on Delivery</p><p className="text-xs text-muted-foreground">Pay when your order arrives</p></div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">FREE</span>
                </label>

                {/* PhonePe */}
                <label className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${payMethod==='phonepe'?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
                  <input type="radio" name="pay" value="phonepe" checked={payMethod==='phonepe'} onChange={()=>setPayMethod('phonepe')} className="accent-primary" />
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-purple-700 font-black text-[10px] leading-none">₹Pe</span>
                    </div>
                    <div><p className="font-bold text-foreground text-sm">Pay via PhonePe</p><p className="text-xs text-muted-foreground">UPI, Card, Net Banking, Wallet</p></div>
                  </div>
                  <div className="hidden sm:flex gap-1">{['UPI','CARD','NB'].map(l=><span key={l} className="text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded">{l}</span>)}</div>
                </label>
              </div>

              {/* Coupon */}
              <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Have a coupon?</p>
                {couponApplied ? (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="font-black text-green-700 font-mono text-sm">{couponApplied.code}</span>
                      <span className="text-xs text-green-600 font-semibold">−₹{couponApplied.discount}</span>
                    </div>
                    <button onClick={()=>setCouponApplied(null)}><X className="h-4 w-4 text-green-500 hover:text-green-700"/></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={e=>setCouponCode(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&applyCoupon()}
                      placeholder="Enter coupon code" className={`${inputCls} flex-1 uppercase font-mono`} />
                    <button onClick={applyCoupon} disabled={applyingCoupon}
                      className="rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-accent transition-all disabled:opacity-50 shrink-0">
                      {applyingCoupon ? '…' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={()=>setStep('address')} className="rounded-xl border border-border px-4 sm:px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary transition-all">Back</button>
                <button onClick={()=>setStep('confirm')} className="flex items-center gap-2 rounded-xl bg-primary px-6 sm:px-8 py-2.5 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all flex-1 sm:flex-none justify-center">
                  Review Order <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 'confirm' && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
              <h2 className="font-bold text-foreground">Review Your Order</h2>

              <div className="rounded-xl bg-secondary/50 border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Delivering To</p>
                    <p className="font-bold text-foreground text-sm">{address.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {address.address_line_1}{address.address_line_2?`, ${address.address_line_2}`:''}<br/>
                      {address.city}, {address.state} — {address.postal_code}<br/>
                      📞 {address.phone}
                    </p>
                  </div>
                  <button onClick={()=>setStep('address')} className="text-xs text-primary font-bold hover:underline shrink-0">Edit</button>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/50 border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Payment</p>
                  <p className="font-bold text-foreground text-sm">
                    {payMethod==='cod' ? '💵 Cash on Delivery' : '📱 PhonePe (UPI / Card)'}
                  </p>
                </div>
                <button onClick={()=>setStep('payment')} className="text-xs text-primary font-bold hover:underline">Change</button>
              </div>

              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">Items ({items.length})</p>
                <div className="space-y-3">
                  {items.map(item=>(
                    <div key={item.product.id} className="flex items-center gap-3">
                      <img src={item.product.images?.[0]} alt={item.product.name} className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}</p>
                      </div>
                      <p className="font-black text-sm text-foreground shrink-0">₹{(item.product.price*item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {payMethod === 'phonepe' && (
                <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-xs text-purple-700">
                  📱 You'll be redirected to PhonePe to complete payment. Please don't close the browser.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={()=>setStep('payment')} className="rounded-xl border border-border px-4 sm:px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary transition-all">Back</button>
                <button
                  onClick={payMethod==='cod' ? placeCOD : placePhonePe}
                  disabled={placing || !user}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20">
                  {placing
                    ? <><span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />Processing…</>
                    : payMethod==='cod'
                      ? <><Truck className="h-4 w-4" />Confirm Order (COD)</>
                      : <><CreditCard className="h-4 w-4" />Pay ₹{total.toLocaleString('en-IN')} via PhonePe</>
                  }
                </button>
              </div>
              {!user && <p className="text-center text-xs text-muted-foreground"><Link to="/auth" className="text-primary font-bold hover:underline">Sign in</Link> to place your order</p>}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h3 className="font-bold text-foreground text-sm mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm pb-3 border-b border-border">
              {items.map(item=>(
                <div key={item.product.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground flex-1 truncate">{item.product.name} ×{item.quantity}</span>
                  <span className="font-semibold shrink-0">₹{(item.product.price*item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm pt-3">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount>0 && <div className="flex justify-between text-green-600 font-semibold"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping===0 ? <span className="text-green-600 font-semibold">Free</span> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground"><span>GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-black text-foreground text-base border-t border-border pt-2 mt-1">
                <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {shipping > 0 && (
              <p className="mt-3 text-xs text-center text-muted-foreground bg-secondary rounded-lg py-2 px-3">
                Add ₹{(999-subtotal).toLocaleString('en-IN')} more for <span className="font-bold text-primary">free shipping</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}