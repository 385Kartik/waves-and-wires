// src/pages/PaymentCallback.tsx
// PhonePe yahan redirect karta hai payment ke baad
// URL: /payment-callback?order=WW-XXXX

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { sendEmail, orderConfirmHtml } from '@/lib/email';
import { sendSms, orderConfirmSms } from '@/lib/sms';

type Status = 'loading' | 'success' | 'failed' | 'pending';

export default function PaymentCallback() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [orderNum, setOrderNum] = useState('');
  const [total, setTotal]       = useState(0);
  const [retries, setRetries]   = useState(0);

  const orderId = searchParams.get('order') ?? searchParams.get('transactionId') ?? '';

  useEffect(() => {
    if (!orderId) { navigate('/'); return; }
    setOrderNum(orderId);
    verifyPayment(orderId);
  }, [orderId]);

  async function verifyPayment(txnId: string, attempt = 0) {
    try {
      // PhonePe se status check karo
      const res  = await fetch('/api/phonepe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'verify', payload: { merchantTransactionId: txnId } }),
      });
      const data = await res.json();

      const payStatus = data?.data?.state; // SUCCESS | FAILED | PENDING

      if (payStatus === 'COMPLETED' || data?.code === 'PAYMENT_SUCCESS') {
        // ✅ Payment successful — DB update karo
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_ref:    data?.data?.transactionId ?? txnId,
            status:         'confirmed',
          })
          .eq('order_number', txnId);

        // Email + SMS
        if (user) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('total, shipping_address, items')
            .eq('order_number', txnId)
            .single();

          if (orderData) {
            setTotal(orderData.total);
            const addr = orderData.shipping_address;
            sendEmail(
              user.email,
              `Order Confirmed — ${txnId}`,
              orderConfirmHtml({
                name: addr?.full_name ?? user.full_name,
                orderNum: txnId,
                items: orderData.items ?? [],
                subtotal: orderData.total,
                discount: 0,
                shipping: 0,
                tax: 0,
                total: orderData.total,
                paymentMethod: 'phonepe',
              })
            );
            if (user.phone) sendSms(user.phone, orderConfirmSms(txnId, orderData.total, user.full_name));
          }
        }

        setStatus('success');

      } else if (payStatus === 'FAILED' || data?.code === 'PAYMENT_ERROR') {
        // ❌ Payment failed — DB update karo
        await supabase
          .from('orders')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('order_number', txnId);

        setStatus('failed');

      } else {
        // ⏳ Pending — 3 baar retry karo (2s interval)
        if (attempt < 3) {
          setRetries(attempt + 1);
          setTimeout(() => verifyPayment(txnId, attempt + 1), 2000);
        } else {
          setStatus('pending');
        }
      }
    } catch (err) {
      console.error('[PaymentCallback] Verify error:', err);
      if (attempt < 3) {
        setTimeout(() => verifyPayment(txnId, attempt + 1), 2000);
      } else {
        setStatus('pending');
      }
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-bold text-foreground">Verifying your payment…</p>
          <p className="text-sm text-muted-foreground mt-1">
            {retries > 0 ? `Retrying… (${retries}/3)` : 'Please wait, do not close this page'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container max-w-md py-16 flex flex-col items-center text-center gap-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">Your order has been confirmed.</p>
          {orderNum && (
            <p className="mt-3 text-sm font-mono bg-secondary rounded-xl px-4 py-2 inline-block">
              Order: <span className="font-black text-foreground">{orderNum}</span>
            </p>
          )}
          {total > 0 && (
            <p className="text-2xl font-black text-primary mt-3">₹{total.toLocaleString('en-IN')}</p>
          )}
        </div>
        <div className="flex gap-3 w-full">
          <Link
            to={`/order-tracking?order=${orderNum}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Track Order <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container max-w-md py-16 flex flex-col items-center text-center gap-6">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Payment Failed</h1>
          <p className="text-muted-foreground mt-2">
            Your payment could not be processed. You have not been charged.
          </p>
          {orderNum && (
            <p className="mt-3 text-sm text-muted-foreground">
              Reference: <span className="font-mono font-bold">{orderNum}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3 w-full">
          <Link
            to="/checkout"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Try Again
          </Link>
          <Link
            to="/shop"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all"
          >
            Continue Shopping
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Need help?{' '}
          <a href="mailto:support@wavesandwires.in" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    );
  }

  // pending
  return (
    <div className="container max-w-md py-16 flex flex-col items-center text-center gap-6">
      <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
        <Clock className="h-10 w-10 text-amber-600" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-foreground">Payment Pending</h1>
        <p className="text-muted-foreground mt-2">
          We're waiting for confirmation from PhonePe. This can take a few minutes.
        </p>
        {orderNum && (
          <p className="mt-3 text-sm font-mono bg-secondary rounded-xl px-4 py-2 inline-block">
            Order: <span className="font-black text-foreground">{orderNum}</span>
          </p>
        )}
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700 text-left w-full">
        <p className="font-bold mb-1">What to do next:</p>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>Check your UPI app for the transaction status</li>
          <li>If payment was deducted, it'll be confirmed within 2 hours</li>
          <li>If not, the amount will be auto-refunded in 5–7 days</li>
        </ul>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => { setStatus('loading'); verifyPayment(orderNum); }}
          className="flex-1 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground hover:bg-secondary transition-all"
        >
          Check Again
        </button>
        <Link
          to={`/order-tracking?order=${orderNum}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Track Order
        </Link>
      </div>
    </div>
  );
}