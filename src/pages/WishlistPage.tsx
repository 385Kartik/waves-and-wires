import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight, Star } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

export default function WishlistPage() {
  const { items, toggleItem  } = useWishlist();
  const { addItem }           = useCart();

  return (
    <div className="container py-10 max-w-6xl">

      {/* Header */}
      <div className="mb-8 flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Saved Items</p>
          <h1 className="text-3xl font-black text-foreground">My Wishlist</h1>
        </div>
        {items.length > 0 && (
          <span className="rounded-2xl border border-border bg-secondary px-4 py-2 text-sm font-bold text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed border-border bg-secondary/50">
            <Heart className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Nothing saved yet</h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
              Browse our collection and tap the heart icon on products you love.
            </p>
          </div>
          <Link to="/shop"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-black hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            Browse Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(product => {
            const discount = product.compare_at_price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : 0;

            return (
              <div key={product.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 transition-all duration-300">

                {/* Discount badge */}
                {discount > 0 && (
                  <div className="absolute top-3 left-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black text-black">
                    {discount}% OFF
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => toggleItem(product)}
                  className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/70 hover:bg-red-600 hover:text-white transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Image */}
                <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-secondary">
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-col flex-1 p-4 gap-3">
                  {/* Rating */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[11px] font-bold text-foreground">{product.rating}</span>
                      <span className="text-[11px] text-muted-foreground">({product.review_count ?? 0})</span>
                    </div>
                  )}

                  <Link to={`/product/${product.slug}`}>
                    <h3 className="text-sm font-bold text-foreground hover:text-primary line-clamp-2 leading-snug transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-primary">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.compare_at_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Stock indicator */}
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-[11px] font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-1 flex gap-2">
                    <button
                      onClick={() => addItem(product)}
                      disabled={product.stock === 0}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-black text-black hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleItem(product)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA when has items */}
      {items.length > 0 && (
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/50 p-5">
          <p className="text-sm text-muted-foreground">
            Want to see more? <Link to="/shop" className="font-bold text-primary hover:underline">Browse all products →</Link>
          </p>
          <p className="text-xs text-muted-foreground">
            🚚 Free shipping on orders above ₹999
          </p>
        </div>
      )}
    </div>
  );
}