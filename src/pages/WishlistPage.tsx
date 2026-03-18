import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  return (
    <div className="container py-12">
      <h1 className="mb-2 text-3xl font-bold text-foreground">My Wishlist</h1>
      <p className="mb-8 text-muted-foreground">{items.length} items</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Heart className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">Your wishlist is empty</p>
          <Link to="/shop" className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(product => (
            <div key={product.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-secondary">
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
              </Link>
              <div className="p-4">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="mb-1 text-sm font-semibold text-foreground hover:text-primary line-clamp-2">{product.name}</h3>
                </Link>
                <p className="mb-3 text-lg font-bold text-primary">₹{product.price.toLocaleString()}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => addItem(product)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-medium text-primary-foreground transition-fast hover:bg-primary/90"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                  </button>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-fast hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
