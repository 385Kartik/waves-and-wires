import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, itemCount, subtotal } = useCart();
  const shipping     = subtotal >= 999 ? 0 : 99;
  const freeShipLeft = 999 - subtotal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="flex w-full max-w-[22rem] sm:max-w-sm flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm">Your Cart</span>
            {itemCount > 0 && (
              <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free shipping bar */}
        {itemCount > 0 && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            {shipping === 0 ? (
              <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />🎉 Free Shipping unlocked!
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-amber-800">
                  Add <span className="font-black text-primary">₹{freeShipLeft.toLocaleString('en-IN')}</span> more for free shipping
                </p>
                <div className="h-1.5 w-full rounded-full bg-amber-200 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / 999) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full py-16 px-6 text-center">
              <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center">
                <ShoppingBag className="h-9 w-9 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-bold text-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add something awesome!</p>
              </div>
              <Link to="/shop" onClick={() => setIsOpen(false)}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              {items.map(item => {
                const atMax = item.quantity >= item.product.stock;
                return (
                  <div key={item.product.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors">
                    <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl border border-border bg-white">
                      <img src={item.product.images?.[0]} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">{item.product.name}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">₹{item.product.price.toLocaleString('en-IN')}</p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary active:scale-95 transition-all">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={atMax}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                          <Plus className="h-3 w-3" />
                        </button>
                        {atMax && (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" />Max
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-sm font-black text-foreground">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      <button onClick={() => removeItem(item.product.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border bg-white p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                {shipping === 0
                  ? <span className="font-semibold text-green-600">Free 🎉</span>
                  : <span className="font-semibold text-foreground">₹{shipping}</span>}
              </div>
              <div className="flex justify-between font-black text-foreground text-base border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">₹{(subtotal + shipping).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Link to="/checkout" onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-black text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/shop" onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}