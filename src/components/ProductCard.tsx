import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Check, Zap, Truck } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop';

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="group relative flex flex-col rounded-3xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:border-primary/50 transition-all duration-300">

      {/* ── Product Photo Container ───────────────────────────────── */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary/50 p-4">
        <img
          src={imageSrc}
          alt={product.name}
          className="h-full w-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {discount > 0 && (
            <span className="rounded-xl bg-yellow-400 text-black px-2.5 py-1 text-[11px] font-black shadow-sm uppercase tracking-wider">
              {discount}% OFF
            </span>
          )}
          {product.is_featured && discount === 0 && (
            <span className="rounded-xl bg-black text-yellow-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
              ★ TOP PICK
            </span>
          )}
          {product.stock === 0 && (
            <span className="rounded-xl bg-zinc-800 text-white px-2 py-0.5 text-[10px] font-bold">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={e => { e.preventDefault(); toggleItem(product); }}
          aria-label="Save to Wishlist"
          className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-2xl transition-all shadow-md backdrop-blur-xs ${
            inWishlist
              ? 'bg-red-500 text-white scale-105'
              : 'bg-white/90 text-zinc-600 hover:text-red-500 hover:bg-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-white' : ''}`} />
        </button>

        {/* Subtle delivery overlay pill */}
        <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/80 px-2 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur-xs">
            <Truck className="h-3 w-3" /> Express Delivery
          </span>
        </div>
      </Link>

      {/* ── Product Info & Actions ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4 gap-2 justify-between">
        <div>
          {/* Category */}
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
            {product.category_name || 'Electronics'}
          </p>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="text-sm font-bold text-foreground mt-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={product.name}>
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-0.5 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating || 4.5)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-muted text-muted-foreground/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-foreground">{product.rating || 4.5}</span>
            <span className="text-[10px] text-muted-foreground">({(product.review_count || 120).toLocaleString()})</span>
          </div>
        </div>

        {/* Price & Add to Cart Row */}
        <div className="mt-2 pt-3 border-t border-border flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-foreground">
                ₹{(product.price || 0).toLocaleString('en-IN')}
              </span>
              {product.compare_at_price && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{product.compare_at_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {product.compare_at_price && (
              <p className="text-[10px] font-extrabold text-green-600">
                Save ₹{(product.compare_at_price - product.price).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Golden Yellow E-Commerce Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label="Add to cart"
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              justAdded
                ? 'bg-black text-yellow-400'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
