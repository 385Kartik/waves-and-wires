import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, itemCount, subtotal } = useCart();
  const shipping = subtotal > 0 ? 199 : 0;
  const total = subtotal + shipping;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {itemCount === 0 ? 'Your cart is empty' : `${itemCount} item${itemCount > 1 ? 's' : ''} in your cart`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 sm:p-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Your cart is currently empty</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Explore our Electric Coconut Scraper and other appliances to add items to your cart.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Return to Shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Link
                    to={`/product/${product.slug}`}
                    className="h-20 w-20 rounded-xl bg-secondary/50 border border-border p-2 shrink-0 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={product.images?.[0] || '/product/scraper-angle-clean.png'}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unit Price: ₹{product.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between xs:justify-end gap-4 w-full xs:w-auto border-t xs:border-t-0 pt-3 xs:pt-0 border-border">
                  <div className="inline-flex items-center rounded-xl border border-border bg-secondary/40">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="h-8 w-8 flex items-center justify-center text-foreground hover:bg-secondary rounded-l-xl transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="h-8 w-8 flex items-center justify-center text-foreground hover:bg-secondary rounded-r-xl transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="font-black text-sm sm:text-base text-foreground min-w-[72px] text-right">
                    ₹{(product.price * quantity).toLocaleString('en-IN')}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    aria-label="Remove item"
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 h-fit space-y-4">
            <h2 className="text-base font-black text-foreground border-b border-border pb-3">
              Cart Totals
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-semibold text-foreground">
                  ₹{shipping}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-black text-foreground">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
