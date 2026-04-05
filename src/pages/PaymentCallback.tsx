// src/pages/PaymentCallback.tsx
// PhonePe payment complete hone ke baad redirect hota hai yaha
// Route: /payment-callback

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';

type Status = 'verifying' | 'success' | 'failed';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const { clearCart }   = useCart();

  const [status,   setStatus]   = useState<Status>('verifying');
  const [orderNum, setOrderNum] = useState('');
  const [errMsg,   setErrMsg]   = useState('');

  useEffect(() => {
    // PhonePe redirectUrl mein ?merchantTransactionId= ya ?transactionId= aata hai
    const txnId = searchParams.get('merchantTransactionId') ?? searchParams.get('transactionId');
    if (!txnId) { setStatus('failed'); setErrMsg('Transaction ID not found.'); return; }
    verifyPayment(txnId);
  }, []);

  async function verifyPayment(txnId: string) {
    try {
      const res  = await fetch('/api/phonepe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'verify', payload: { merchantTransactionId: txnId } }),
      });
      const data = await res.json();

      const isSuccess =
        data.success === true &&
        (data.data?.state === 'COMPLETED' || data.code === 'PAYMENT_SUCCESS');

      if (isSuccess) {
        // DB mein payment_status → paid, status → confirmed
        await supabase
          .from('orders')
          .update({ payment_status: 'paid', status: 'confirmed' })
          .eq('order_number', txnId);

        setOrderNum(txnId);
        setStatus('success');
        clearCart();

        // 3 sec baad order tracking page pe bhejo
        setTimeout(() => navigate(`/order-tracking?order=${txnId}`), 3000);
      } else {
        // Payment fail — order pending rehta hai (admin handle kar sakta hai)
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('order_number', txnId);

        setStatus('failed');
        setErrMsg(data.message ?? data.data?.responseCodeDescription ?? 'Payment was not completed.');
      }
    } catch (err: any) {
      setStatus('failed');
      setErrMsg(err.message ?? 'Verification failed. Please contact support.');
    }
  }

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (status === 'verifying') return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-base font-semibold text-foreground">Verifying your payment…</p>
      <p className="text-sm text-muted-foreground">Please don't close this page.</p>
    </div>
  );

  // ── Success ────────────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4 text-center">
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-black text-foreground">Payment Successful!</h1>
      <p className="text-sm text-muted-foreground">
        Order <span className="font-bold text-foreground">#{orderNum}</span> confirmed.
      </p>
      <p className="text-xs text-muted-foreground">Redirecting to your order in 3 seconds…</p>
      <Link
        to={`/order-tracking?order=${orderNum}`}
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
        View Order →
      </Link>
    </div>
  );

  // ── Failed ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4 text-center">
      <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-black text-foreground">Payment Failed</h1>
      <p className="text-sm text-muted-foreground max-w-sm">{errMsg}</p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all">
          ← Go Back
        </button>
        <Link
          to="/shop"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
          Continue Shopping
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Need help? Contact <a href="mailto:support@wavesandwires.in" className="text-primary hover:underline">support@wavesandwires.in</a>
      </p>
    </div>
  );
}