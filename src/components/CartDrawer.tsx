import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, itemCount, subtotal } = useCart();
  const shipping     = subtotal >= 999 ? 0 : 99;
  const freeShipLeft = 999 - subtotal;
  const freeShipPct  = Math.min((subtotal / 999) * 100, 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="flex w-full max-w-[360px] flex-col bg-[#fafaf8] shadow-2xl">

        {/* ── Header ───────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-2xl bg-amber-400 flex items-center justify-center shadow-sm">
                <ShoppingBag className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full bg-stone-900 text-[9px] font-black text-white leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-black text-stone-900 leading-none">Cart</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {itemCount === 0 ? 'Empty' : `${itemCount} item${itemCount > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Free shipping bar ─────────────────────── */}
        {itemCount > 0 && (
          <div className="px-5 py-3.5 bg-white border-b border-stone-100">
            {shipping === 0 ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs font-bold text-green-700">Free shipping unlocked! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-stone-500">
                  Add <span className="font-black text-amber-500">₹{freeShipLeft.toLocaleString('en-IN')}</span> more for free shipping
                </p>
                <div className="relative h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                    style={{ width: `${freeShipPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Items ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 py-16 px-8 text-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-stone-100 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-stone-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm">
                  <span className="text-sm">🛍️</span>
                </div>
              </div>
              <div>
                <p className="font-black text-stone-900 text-base">Nothing here yet</p>
                <p className="text-sm text-stone-400 mt-1">Add something awesome to get started</p>
              </div>
              <Link to="/shop" onClick={() => setIsOpen(false)}
                className="rounded-2xl bg-stone-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-stone-700 transition-all">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map(item => {
                const atMax = item.quantity >= item.product.stock;
                return (
                  <div key={item.product.id}
                    className="group bg-white rounded-2xl border border-stone-100 p-3 hover:border-amber-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="h-[72px] w-[72px] shrink-0 rounded-xl overflow-hidden bg-stone-50 border border-stone-100">
                        <img
                          src={item.product.images?.[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-bold text-stone-800 leading-tight line-clamp-2 flex-1">
                            {item.product.name}
                          </p>
                          <button onClick={() => removeItem(item.product.id)}
                            className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-stone-300 hover:bg-red-50 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Qty stepper */}
                          <div className="flex items-center gap-1 bg-stone-50 rounded-xl p-0.5 border border-stone-100">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-6 w-6 rounded-lg flex items-center justify-center text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm transition-all active:scale-95">
                              <Minus className="h-3 w-3" strokeWidth={2.5} />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-stone-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={atMax}
                              className="h-6 w-6 rounded-lg flex items-center justify-center text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                              <Plus className="h-3 w-3" strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-sm font-black text-stone-900">
                              ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-stone-400">
                                ₹{item.product.price.toLocaleString('en-IN')} each
                              </p>
                            )}
                          </div>
                        </div>

                        {atMax && (
                          <p className="mt-1.5 text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Max stock reached
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────── */}
        {items.length > 0 && (
          <div className="bg-white border-t border-stone-100 p-5 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Shipping</span>
                {shipping === 0
                  ? <span className="font-bold text-green-600">Free</span>
                  : <span className="font-bold text-stone-900">₹{shipping}</span>
                }
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                <span className="font-black text-stone-900">Total</span>
                <span className="text-lg font-black text-amber-500">
                  ₹{(subtotal + shipping).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link to="/checkout" onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3.5 text-sm font-black text-white hover:bg-stone-700 active:scale-[0.98] transition-all">
              Checkout
              <div className="h-5 w-5 rounded-lg bg-amber-400 flex items-center justify-center">
                <ArrowRight className="h-3 w-3 text-stone-900" strokeWidth={3} />
              </div>
            </Link>

            <button onClick={() => setIsOpen(false)}
              className="w-full text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors py-1">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}