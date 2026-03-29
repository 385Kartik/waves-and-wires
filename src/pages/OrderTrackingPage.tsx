import { useState, useEffect, useCallback, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Package, Truck, CheckCircle, Clock,
  ShoppingBag, XCircle, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { supabase }  from '@/lib/supabase';
import { useAuth }   from '@/contexts/AuthContext';
import { toast }     from 'sonner';
import { format }    from 'date-fns';
import { sendEmail, cancelEmailHtml, refundRequestHtml } from '@/lib/email';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string; product_name: string; product_image: string;
  quantity: number; price: number; total: number;
}

interface Order {
  id: string; order_number: string; status: string;
  payment_status: string; payment_method: string;
  total: number; subtotal: number; shipping: number;
  discount: number; tax: number; created_at: string;
  tracking_number: string | null; shipping_address: any;
  order_items: OrderItem[];
  refund_status?:          string | null;
  awb_code?:               string | null;
  courier_name?:           string | null;
  shiprocket_order_id?:    string | null;
  shiprocket_shipment_id?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMELINE        = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;
const TIMELINE_LABELS: Record<string, string> = {
  pending: 'Order Placed', confirmed: 'Confirmed',
  processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered',
};
const TIMELINE_ICONS: Record<string, any> = {
  pending: Clock, confirmed: CheckCircle,
  processing: Package, shipped: Truck, delivered: CheckCircle,
};
const CANCEL_REASONS = [
  'Ordered by mistake', 'Found a better price elsewhere',
  'Delivery time is too long', 'Changed my mind', 'Duplicate order', 'Other',
];

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// ─── Helpers (defined outside to avoid recreation) ───────────────────────────

function canCancel(o: Order) { return ['pending', 'confirmed'].includes(o.status); }
function canRefund(o: Order) { return o.status === 'delivered' && !o.refund_status; }

function RefundBadge({ o }: { o: Order }) {
  if (!o.refund_status) return null;
  const colorMap: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    approved:  'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
  };
  const labelMap: Record<string, string> = {
    pending: 'Refund Requested', approved: 'Refund Approved',
    completed: 'Refunded',       rejected: 'Refund Rejected',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorMap[o.refund_status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {labelMap[o.refund_status] ?? o.refund_status}
    </span>
  );
}

// ─── OrderCard — OUTSIDE parent component ────────────────────────────────────
// Defining this inside OrderTrackingPage would cause React to treat it as a
// new component type on every render, resetting all hook state (srTracking etc).

interface OrderCardProps {
  o:             Order;
  user:          any;
  onCancelClick: (o: Order) => void;
  onRefundClick: (o: Order) => void;
}

const OrderCard = memo(function OrderCard({ o, user, onCancelClick, onRefundClick }: OrderCardProps) {
  const step                        = TIMELINE.indexOf(o.status as any);
  const [srTracking, setSrTracking] = useState<any>(null);
  const [srLoading,  setSrLoading]  = useState(false);

  const fetchTracking = useCallback(async () => {
    if (!o.awb_code) return;
    setSrLoading(true);
    try {
      const res  = await fetch('/api/shiprocket', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'track_awb', payload: { awb: o.awb_code } }),
      });
      const data = await res.json();
      setSrTracking(data?.tracking_data ?? data ?? null);
    } catch {
      toast.error('Could not fetch live tracking');
    } finally {
      setSrLoading(false);
    }
  }, [o.awb_code]);

  // Auto-fetch jab component mount ho
  useEffect(() => {
    if (o.awb_code) fetchTracking();
  }, [o.awb_code, fetchTracking]);

  const statusColor =
    o.status === 'delivered' ? 'bg-green-100 text-green-700' :
    o.status === 'cancelled' ? 'bg-red-100 text-red-700'    : 'bg-amber-100 text-amber-700';

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-foreground text-sm">#{o.order_number}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(o.created_at), 'dd MMM yyyy, h:mm a')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="font-bold text-foreground text-sm">{INR(o.total)}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor}`}>
            {o.status}
          </span>
          <RefundBadge o={o} />
        </div>
      </div>

      {/* Item thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {o.order_items?.slice(0, 4).map(item => (
          <div key={item.id} className="shrink-0">
            {item.product_image
              ? <img src={item.product_image} alt={item.product_name}
                     className="h-11 w-11 rounded-xl object-cover border border-border" />
              : <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>}
          </div>
        ))}
        {(o.order_items?.length ?? 0) > 4 && (
          <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-muted-foreground">+{o.order_items.length - 4}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {o.status !== 'cancelled' && (
        <div className="flex items-center gap-0">
          {TIMELINE.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`h-2 w-2 rounded-full shrink-0 ${i <= step ? 'bg-primary' : 'bg-border'}`} />
              {i < TIMELINE.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Live Shiprocket tracking */}
      {o.awb_code && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Live Tracking</p>
              <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">AWB: {o.awb_code}</p>
              {o.courier_name && <p className="text-[10px] text-blue-600">{o.courier_name}</p>}
            </div>
            <button
              onClick={fetchTracking} disabled={srLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {srLoading
                ? <span className="h-3 w-3 rounded-full border-2 border-blue-300 border-t-blue-700 animate-spin" />
                : <RefreshCw className="h-3 w-3" />}
              {srLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {srTracking && (
            <div className="border-t border-blue-200 pt-2 space-y-1">
              <p className="text-xs font-bold text-blue-800">
                {srTracking.shipment_status || srTracking.current_status || 'In Transit'}
              </p>
              {srTracking.etd && (
                <p className="text-[11px] text-blue-600">Estimated delivery: {srTracking.etd}</p>
              )}
              {srTracking.awb_track_url && (
                <a href={srTracking.awb_track_url} target="_blank" rel="noopener noreferrer"
                   className="text-[11px] text-blue-700 font-bold hover:underline block">
                  Track on courier website →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fallback tracking number */}
      {o.tracking_number && !o.awb_code && (
        <p className="text-xs text-muted-foreground">
          Tracking: <span className="font-mono font-semibold text-foreground">{o.tracking_number}</span>
        </p>
      )}

      {/* Action buttons */}
      {user && (
        <div className="flex flex-wrap gap-2">
          {canCancel(o) && (
            <button
              onClick={() => onCancelClick(o)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel Order
            </button>
          )}
          {canRefund(o) && (
            <button
              onClick={() => onRefundClick(o)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Request Refund
            </button>
          )}
          {o.refund_status === 'rejected' && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <XCircle className="h-3.5 w-3.5" /> Refund rejected. Contact support.
            </span>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderTrackingPage() {
  const [searchParams]                    = useSearchParams();
  const { user }                          = useAuth();
  const [query,         setQuery]         = useState(searchParams.get('order') ?? '');
  const [order,         setOrder]         = useState<Order | null>(null);
  const [myOrders,      setMyOrders]      = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [searched,      setSearched]      = useState(false);
  const [tab,           setTab]           = useState<'track' | 'myorders'>('track');
  const [cancelModal,   setCancelModal]   = useState<Order | null>(null);
  const [cancelReason,  setCancelReason]  = useState('');
  const [cancelOther,   setCancelOther]   = useState('');
  const [refundModal,   setRefundModal]   = useState<Order | null>(null);
  const [refundReason,  setRefundReason]  = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) search(orderParam);
    if (searchParams.get('tab') === 'myorders') setTab('myorders');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data helpers ──────────────────────────────────────────────────────────

  async function enrichWithRefundStatus(orders: any[]): Promise<Order[]> {
    if (!orders.length) return orders;
    const { data: refunds } = await supabase
      .from('refund_requests')
      .select('order_id, status')
      .in('order_id', orders.map(o => o.id));
    const map: Record<string, string> = {};
    (refunds ?? []).forEach((r: any) => { map[r.order_id] = r.status; });
    return orders.map(o => ({ ...o, refund_status: map[o.id] ?? null }));
  }

  const loadMyOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), awb_code, courier_name, shiprocket_order_id, shiprocket_shipment_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMyOrders(await enrichWithRefundStatus(data ?? []));
  }, [user]);

  useEffect(() => { loadMyOrders(); }, [loadMyOrders]);

  async function search(num?: string) {
    const q = num ?? query;
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), awb_code, courier_name, shiprocket_order_id, shiprocket_shipment_id')
      .ilike('order_number', q.trim())
      .single();
    if (data) {
      const [enriched] = await enrichWithRefundStatus([data]);
      setOrder(enriched ?? null);
    } else {
      setOrder(null);
    }
    setLoading(false);
  }

  // ── Cancel flow ───────────────────────────────────────────────────────────

  async function cancelOrder(o: Order) {
  const reason = cancelReason === 'Other' ? cancelOther.trim() : cancelReason;
  if (!reason) { toast.error('Please select a reason'); return; }
  if (!user) { toast.error('Please sign in to cancel orders'); return; }
 
  setActionLoading(true);
  try {
    // ── 1. Verify order is still cancellable (fresh read to avoid race) ──────
    const { data: freshOrder, error: verifyErr } = await supabase
      .from('orders')
      .select('status, user_id')
      .eq('id', o.id)
      .single();
 
    if (verifyErr || !freshOrder)
      throw new Error('Could not verify order. Please refresh and try again.');
 
    if (freshOrder.user_id !== user.id)
      throw new Error('Unauthorized — this order does not belong to your account.');
 
    if (!['pending', 'confirmed'].includes(freshOrder.status))
      throw new Error(`Order cannot be cancelled. Current status: "${freshOrder.status}".`);
 
    // ── 2. Cancel in DB ──────────────────────────────────────────────────────
    const { error: cancelErr } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', o.id)
      .eq('user_id', user.id);  // double-check ownership at DB level
 
    if (cancelErr) throw cancelErr;
 
    // ── 3. Cancel in Shiprocket ──────────────────────────────────────────────
    if (o.shiprocket_order_id) {
      const srAction  = o.awb_code ? 'cancel_shipment' : 'cancel_order';
      const srPayload = o.awb_code
        ? { awb_code: o.awb_code }
        : { shiprocket_order_id: o.shiprocket_order_id };
 
      await fetch('/api/shiprocket', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: srAction, payload: srPayload }),
      }).catch(e => console.warn('[SR Cancel silent fail]', e.message));
    }
 
    // ── 4. Email notification ─────────────────────────────────────────────────
    const isOnline = o.payment_method === 'razorpay' && o.payment_status === 'paid';
    if (user.email) {
      sendEmail(
        user.email,
        `Order ${o.order_number} Cancelled`,
        cancelEmailHtml(
          o.shipping_address?.full_name ?? 'Customer',
          o.order_number, o.total, reason, isOnline,
        ),
      );
    }
 
    // ── 5. UI cleanup ─────────────────────────────────────────────────────────
    toast.success(
      isOnline
        ? 'Order cancelled. Refund will be processed within 5–7 business days.'
        : 'Order cancelled successfully.',
    );
    setCancelModal(null); setCancelReason(''); setCancelOther('');
    await loadMyOrders();
    if (order?.id === o.id) setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
 
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to cancel order. Please try again.');
  } finally {
    setActionLoading(false);
  }
}

  // ── Refund flow ───────────────────────────────────────────────────────────

  async function requestRefund(o: Order) {
    if (!refundReason.trim() || refundReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)'); return;
    }
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_refund', {
        p_order_id: o.id, p_reason: refundReason.trim(),
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) { toast.error(result.error ?? 'Could not submit refund request'); return; }

      if (user?.email) {
        sendEmail(
          user.email,
          `Refund Request Received — ${o.order_number}`,
          refundRequestHtml(o.shipping_address?.full_name ?? 'Customer', o.order_number, o.total),
        );
      }
      toast.success("Refund request submitted! We'll review it within 2–3 business days.");
      setRefundModal(null); setRefundReason('');
      await loadMyOrders();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit refund request');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Callbacks for OrderCard (stable references with useCallback) ───────────

  const handleCancelClick = useCallback((o: Order) => {
    setCancelModal(o); setCancelReason(''); setCancelOther('');
  }, []);

  const handleRefundClick = useCallback((o: Order) => {
    setRefundModal(o); setRefundReason('');
  }, []);

  // ── "Track" tab — detailed view ───────────────────────────────────────────

  const currentStep = order ? TIMELINE.indexOf(order.status as any) : -1;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container py-6 sm:py-10 max-w-2xl">
      <div className="mb-5 sm:mb-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Track Your Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your order number to see the latest status</p>
      </div>

      {/* Tab switcher (only for logged-in users) */}
      {user && (
        <div className="flex gap-2 border-b border-border mb-5 sm:mb-6">
          {(['track', 'myorders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 px-1 text-sm font-semibold transition-colors ${
                tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'myorders' ? 'My Orders' : 'Track by Number'}
            </button>
          ))}
        </div>
      )}

      {/* ── TRACK TAB ─────────────────────────────────────────────────── */}
      {tab === 'track' && (
        <div className="space-y-4 sm:space-y-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="e.g. WW-0001234"
                className="w-full rounded-xl border border-input bg-secondary pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <button onClick={() => search()} disabled={loading}
              className="rounded-xl bg-primary px-4 sm:px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? '…' : 'Track'}
            </button>
          </div>

          {searched && !loading && !order && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground">Order not found</p>
              <p className="text-sm text-muted-foreground mt-1">Double-check your order number</p>
            </div>
          )}

          {order && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Order header */}
              <div className="bg-secondary/50 px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-base sm:text-lg text-foreground">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(order.created_at), 'PPp')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700'    : 'bg-amber-100 text-amber-700'
                    }`}>{order.status}</span>
                    <RefundBadge o={order} />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                {/* Timeline */}
                {order.status !== 'cancelled' && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Order Progress</p>
                    <div className="relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                      <div className="space-y-5">
                        {TIMELINE.map((s, i) => {
                          const done = i <= currentStep;
                          const Icon = TIMELINE_ICONS[s];
                          return (
                            <div key={s} className="relative flex items-center gap-4 pl-10">
                              <div className={`absolute left-0 h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                done ? 'bg-primary border-primary' : 'bg-card border-border'
                              }`}>
                                <Icon className={`h-4 w-4 ${done ? 'text-white' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {TIMELINE_LABELS[s]}
                                </p>
                                {i === currentStep && (
                                  <p className="text-xs text-primary font-medium">Current status</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Shiprocket tracking (track tab) */}
                {order.awb_code && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-1">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Live Tracking</p>
                    <p className="font-mono font-bold text-blue-900 text-sm">AWB: {order.awb_code}</p>
                    {order.courier_name && <p className="text-xs text-blue-600">{order.courier_name}</p>}
                  </div>
                )}

                {/* Tracking number fallback */}
                {order.tracking_number && !order.awb_code && (
                  <div className="rounded-xl bg-secondary/50 p-4 border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Tracking Number</p>
                    <p className="font-mono font-bold text-foreground">{order.tracking_number}</p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Items</p>
                  <div className="space-y-3">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product_image
                          ? <img src={item.product_image} alt={item.product_name}
                                 className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover border border-border shrink-0" />
                          : <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-secondary shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {INR(item.price)}</p>
                        </div>
                        <p className="font-bold text-sm text-foreground shrink-0">{INR(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="border-t border-border pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{INR(order.subtotal)}</span></div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600"><span>Discount</span><span>−{INR(order.discount)}</span></div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span><span>{order.shipping > 0 ? INR(order.shipping) : 'Free'}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{INR(order.tax)}</span></div>
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                    <span>Total</span><span>{INR(order.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                {user && (
                  <div className="flex flex-wrap gap-2">
                    {canCancel(order) && (
                      <button onClick={() => handleCancelClick(order)}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all">
                        <XCircle className="h-4 w-4" /> Cancel Order
                      </button>
                    )}
                    {canRefund(order) && (
                      <button onClick={() => handleRefundClick(order)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-all">
                        <RefreshCw className="h-4 w-4" /> Request Refund
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MY ORDERS TAB ─────────────────────────────────────────────── */}
      {tab === 'myorders' && user && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 sm:p-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-foreground">No orders yet</p>
              <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                Start Shopping →
              </Link>
            </div>
          ) : myOrders.map(o => (
            <OrderCard
              key={o.id} o={o} user={user}
              onCancelClick={handleCancelClick}
              onRefundClick={handleRefundClick}
            />
          ))}
        </div>
      )}

      {/* ── CANCEL MODAL ──────────────────────────────────────────────── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Why are you cancelling?</h3>
                <p className="text-xs text-muted-foreground">#{cancelModal.order_number} · {INR(cancelModal.total)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {CANCEL_REASONS.map(reason => (
                <label key={reason}
                  className={`flex items-center gap-3 rounded-xl border px-3 sm:px-4 py-2.5 cursor-pointer transition-all ${
                    cancelReason === reason ? 'border-red-300 bg-red-50' : 'border-border hover:border-red-200 hover:bg-red-50/50'
                  }`}>
                  <div className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    cancelReason === reason ? 'border-red-500' : 'border-muted-foreground/40'
                  }`}>
                    {cancelReason === reason && <div className="h-2 w-2 rounded-full bg-red-500" />}
                  </div>
                  <input type="radio" className="hidden" name="cancel_reason"
                    onChange={() => { setCancelReason(reason); setCancelOther(''); }} />
                  <span className="text-sm text-foreground">{reason}</span>
                </label>
              ))}
              {cancelReason === 'Other' && (
                <textarea value={cancelOther} onChange={e => setCancelOther(e.target.value)}
                  rows={2} maxLength={200} placeholder="Please tell us more…"
                  className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none" />
              )}
            </div>

            {cancelModal.payment_method === 'razorpay' && cancelModal.payment_status === 'paid' && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                💳 Since you paid online, your refund of <strong>{INR(cancelModal.total)}</strong> will be processed within 5–7 business days.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setCancelModal(null); setCancelReason(''); setCancelOther(''); }}
                disabled={actionLoading}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary transition-all">
                Keep Order
              </button>
              <button
                onClick={() => cancelOrder(cancelModal)}
                disabled={actionLoading || !cancelReason || (cancelReason === 'Other' && !cancelOther.trim())}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40 transition-all">
                {actionLoading ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ──────────────────────────────────────────────── */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Request Refund</h3>
                <p className="text-xs text-muted-foreground">#{refundModal.order_number} · {INR(refundModal.total)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Tell us why you'd like a refund. Our team reviews within 2–3 business days.
            </p>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Reason *
              </label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)}
                rows={3} maxLength={500}
                placeholder="e.g. Product damaged, wrong item received, not as described…"
                className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none" />
              <p className="text-[10px] text-muted-foreground text-right mt-1">{refundReason.length}/500</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              Refunds are processed to the original payment method within 5–7 business days after approval.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRefundModal(null)} disabled={actionLoading}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary transition-all">
                Cancel
              </button>
              <button onClick={() => requestRefund(refundModal)} disabled={actionLoading}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all">
                {actionLoading ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}