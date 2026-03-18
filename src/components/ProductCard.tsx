import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();

  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-primary/8 hover:border-primary/30 transition-all duration-300">

      {/* Image */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-lg bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow-sm">
              {discount}% OFF
            </span>
          )}
          {product.stock === 0 && (
            <span className="rounded-lg bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background">
              Sold Out
            </span>
          )}
          {product.is_featured && !discount && (
            <span className="rounded-lg bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={e => { e.preventDefault(); toggleItem(product); }}
          className={`absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-xl transition-all shadow-sm ${
            inWishlist
              ? 'bg-red-500 text-white scale-110'
              : 'bg-white/90 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-white' : ''}`} />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5 gap-2">
        <Link to={`/product/${product.slug}`}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {product.category_name}
          </p>
          <h3 className="text-sm font-bold text-foreground mt-0.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${
                  i < Math.floor(product.rating)
                    ? 'fill-primary text-primary'
                    : 'fill-muted text-muted-foreground/20'
                }`} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">({product.review_count})</span>
          </div>
        )}

        {/* Price + Cart */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <span className="text-base font-black text-foreground">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && (
              <span className="ml-1.5 text-xs text-muted-foreground line-through">
                ₹{product.compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20 hover:shadow-primary/30 active:scale-95"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
