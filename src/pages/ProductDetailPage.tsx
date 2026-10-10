import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Minus, Plus, Check, Truck, Shield, RotateCcw, User, ThumbsUp } from 'lucide-react';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProductCard from '@/components/ProductCard';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
  reviewer_name: string;
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading } = useProduct(slug ?? '');
  const { products: related } = useProducts({ limit: 8 });
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [added, setAdded] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    setSelectedImage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    if (activeTab === 'reviews' && product?.id) loadReviews();
  }, [activeTab, product?.id]);

  useEffect(() => {
    if (!user || !product?.id) return;
    apiClient.get(`/products/${product.id}/purchased`)
      .then((res) => {
        const purchased = res.data?.data?.purchased || res.data?.purchased || false;
        setHasPurchased(purchased);
      })
      .catch(() => {});
  }, [user, product?.id]);

  async function loadReviews() {
    if (!product?.id) return;
    setReviewsLoading(true);
    try {
      const res = await apiClient.get(`/products/${product.id}/reviews`);
      const data = res.data?.data || res.data || [];
      const mapped: Review[] = data.map((r: any) => ({
        id: r.id || r._id, user_id: r.user_id, rating: r.rating,
        title: r.title, comment: r.comment, is_verified: r.is_verified,
        created_at: r.created_at || new Date().toISOString(),
        reviewer_name: r.reviewer_name || 'Customer',
      }));
      setReviews(mapped);
      if (user) {
        const mine = mapped.find(r => r.user_id === user.id) ?? null;
        setMyReview(mine);
        if (mine) setReviewForm({ rating: mine.rating, title: mine.title ?? '', comment: mine.comment ?? '' });
      }
    } catch {}
    setReviewsLoading(false);
  }

  async function submitReview() {
    if (!user || !product?.id) { toast.error('Sign in to write a review'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a review comment'); return; }
    if (reviewForm.comment.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }
    const sanitize = (s: string) => s.replace(/[<>]/g, '').trim().slice(0, 500);
    setSubmitting(true);
    try {
      const payload = {
        product_id: product.id, user_id: user.id, rating: reviewForm.rating,
        title: sanitize(reviewForm.title) || null, comment: sanitize(reviewForm.comment),
        is_verified: hasPurchased,
      };
      if (myReview) {
        const res = await apiClient.put(`/products/${product.id}/reviews/${myReview.id}`, payload);
        if (!res.data?.success && res.status !== 200 && res.status !== 201) throw new Error(res.data?.message || 'Failed');
        toast.success('Review updated!');
      } else {
        const res = await apiClient.post(`/products/${product.id}/reviews`, payload);
        if (!res.data?.success && res.status !== 200 && res.status !== 201) {
          if (res.data?.message?.includes('already reviewed')) toast.error('You already reviewed this product');
          else throw new Error(res.data?.message || 'Failed');
          return;
        }
        toast.success('Review submitted! Thank you.');
      }
      setShowReviewForm(false);
      await loadReviews();
    } catch (err: any) { toast.error(err.message ?? 'Failed to submit review'); }
    finally { setSubmitting(false); }
  }

  async function deleteReview() {
    if (!myReview || !product?.id) return;
    try {
      await apiClient.delete(`/products/${product.id}/reviews/${myReview.id}`);
      toast.success('Review deleted');
      setMyReview(null); setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      await loadReviews();
    } catch {
      toast.error('Failed to delete review');
    }
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2 animate-pulse">
          <div className="aspect-square rounded-2xl bg-secondary" />
          <div className="space-y-4">
            <div className="h-8 rounded bg-secondary w-3/4" />
            <div className="h-4 rounded bg-secondary w-1/2" />
            <div className="h-10 rounded bg-secondary w-1/3" />
            <div className="h-24 rounded bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center max-w-7xl">
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <Link to="/shop" className="mt-4 inline-block text-primary font-bold hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const relatedProducts = related.filter((p: any) => p.id !== product.id).slice(0, 4);
  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop'];

  return (
    <div className="container py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category_id}`} className="hover:text-primary transition-colors">{product.category_name || 'Products'}</Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product card */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-card shadow-sm flex items-center justify-center p-4">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 rounded-xl bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-sm">
                {discount}% OFF
              </span>
            )}
            <button
              onClick={() => toggleItem(product)}
              className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-2xl transition-all shadow-sm ${
                inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all p-1 bg-card ${
                    selectedImage === i ? 'border-primary shadow-sm scale-105' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div className="flex flex-col space-y-5">
          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              {product.category_name || 'Electronics'}
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black text-foreground leading-tight">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating || 4.5) ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground/20'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">{product.rating || 4.5}</span>
              <span className="text-xs text-muted-foreground">({product.review_count || 120} reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 rounded-2xl bg-secondary/50 p-4">
            <span className="text-3xl font-black text-foreground">
              ₹{(product.price || 0).toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && (
              <span className="text-lg text-muted-foreground line-through">
                ₹{product.compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
            {discount > 0 && (
              <span className="rounded-lg bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-600">
                Save ₹{((product.compare_at_price || 0) - (product.price || 0)).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.short_description || product.description}
          </p>

          {/* Quantity & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</span>
              <div className="flex items-center rounded-xl border border-border bg-card">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 text-foreground hover:text-primary disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-1.5 text-foreground hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs font-semibold text-green-600">
                {product.stock > 0 ? '✓ In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  for (let i = 0; i < quantity; i++) addItem(product);
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1500);
                }}
                disabled={product.stock === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shadow-md shadow-primary/20 active:scale-[0.99]"
              >
                {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {added ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">Free Shipping above ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">1 Year Brand Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">7 Days Easy Return</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        <div className="flex border-b border-border">
          {[
            ['description', 'Description'],
            ['specs', 'Specifications'],
            ['reviews', `Reviews (${reviews.length})`],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`border-b-2 px-6 py-3 text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-muted-foreground leading-relaxed text-sm space-y-4">
              <p>{product.description}</p>
              {product.features && product.features.length > 0 && (
                <div>
                  <h4 className="font-bold text-foreground mb-2">Key Highlights:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {product.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {product.specifications && Object.entries(product.specifications).map(([key, val], i) => (
                    <tr key={key} className={i % 2 === 0 ? 'bg-secondary/40' : ''}>
                      <td className="px-4 py-3 font-semibold text-muted-foreground w-1/3">{key}</td>
                      <td className="px-4 py-3 text-foreground">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-lg">Customer Reviews</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{reviews.length} reviews for this product</p>
                </div>
                {!showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{myReview ? 'Edit Your Review' : 'Write a Review'}</h4>
                    <button onClick={() => setShowReviewForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onMouseEnter={() => setHoverStar(s)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                        >
                          <Star className={`h-6 w-6 ${(hoverStar || reviewForm.rating) >= s ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      rows={3}
                      placeholder="Share your experience with this product..."
                      className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : myReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    {myReview && (
                      <button onClick={deleteReview} className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews list */}
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{r.reviewer_name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-black text-foreground mb-6">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
