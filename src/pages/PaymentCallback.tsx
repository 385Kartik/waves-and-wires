// src/pages/PaymentCallback.tsx
// FIX: All DB writes moved server-side (via /api/phonepe confirm action).
// Client only reads status — never writes order state directly.
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

type Status = 'verifying' | 'success' | 'failed' | 'pending';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const { clearCart }   = useCart();

  const [status,   setStatus]   = useState<Status>('verifying');
  const [orderNum, setOrderNum] = useState('');
  const [errMsg,   setErrMsg]   = useState('');
  const [retries,  setRetries]  = useState(0);

  useEffect(() => {
    const orderParam = searchParams.get('order') ?? '';
    const txnParam   = searchParams.get('txn')   ?? orderParam;
    if (!orderParam) { navigate('/'); return; }
    setOrderNum(orderParam);
    verifyPayment(txnParam, orderParam);
  }, []); // eslint-disable-line

  // Server handles ALL DB writes. We just ask the server to confirm
  // and read its response. Never supabase.update() from here.
  async function verifyPayment(txnId: string, orderNumber: string, attempt = 0) {
    try {
      const res  = await fetch('/api/phonepe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action:  'confirm', // new server-side action that verifies + updates DB
          payload: { merchantTransactionId: txnId, orderNumber },
        }),
      });
      const data = await res.json();

      if (data.success && (data.state === 'COMPLETED' || data.alreadyConfirmed)) {
        clearCart();
        setStatus('success');
        setTimeout(() => navigate(`/order-tracking?order=${orderNumber}`), 3000);
        return;
      }

      if (!data.success && data.state === 'FAILED') {
        setErrMsg(data.error ?? 'Your payment could not be processed.');
        setStatus('failed');
        return;
      }

      // PENDING or network issue — retry up to 5 times with backoff
      if (attempt < 5) {
        setRetries(attempt + 1);
        const delay = Math.min(2000 * (attempt + 1), 8000);
        setTimeout(() => verifyPayment(txnId, orderNumber, attempt + 1), delay);
      } else {
        setStatus('pending');
      }
    } catch {
      if (attempt < 5) {
        setRetries(attempt + 1);
        setTimeout(() => verifyPayment(txnId, orderNumber, attempt + 1), 3000);
      } else {
        setStatus('pending');
      }
    }
  }

  if (status === 'verifying') return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-base font-semibold text-foreground">Verifying your payment…</p>
      <p className="text-sm text-muted-foreground">
        {retries > 0 ? `Retrying… (${retries}/5)` : "Please don't close this page."}
      </p>
    </div>
  );

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
      <Link to={`/order-tracking?order=${orderNum}`}
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
        View Order →
      </Link>
    </div>
  );

  if (status === 'pending') return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4 text-center">
      <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
        <Clock className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="text-2xl font-black text-foreground">Payment Pending</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Waiting for confirmation from PhonePe. This may take a few minutes.
      </p>
      {orderNum && (
        <p className="text-xs font-mono bg-secondary rounded-lg px-4 py-2">
          Order: <span className="font-black">{orderNum}</span>
        </p>
      )}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700 text-left max-w-sm w-full">
        <p className="font-bold mb-1">What to do:</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>Check your UPI app for transaction status</li>
          <li>If payment was deducted, it'll confirm within 2 hours</li>
          <li>If not, amount will auto-refund in 5–7 days</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <Link to={`/order-tracking?order=${orderNum}`}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
          Track Order
        </Link>
        <a href="mailto:support@wavesandwires.in"
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all">
          Contact Support
        </a>
      </div>
    </div>
  );

  // failed
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4 text-center">
      <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-black text-foreground">Payment Failed</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        {errMsg || 'Your payment could not be processed. You have not been charged.'}
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={() => navigate(-1)}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all">
          ← Go Back
        </button>
        <Link to="/shop"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
          Continue Shopping
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Need help? <a href="mailto:support@wavesandwires.in" className="text-primary hover:underline">support@wavesandwires.in</a>
      </p>
    </div>
  );
}