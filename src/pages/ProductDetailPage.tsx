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

import { OFFICIAL_SCRAPER_REVIEWS } from '@/data/scraperReviews';

interface Review {
  id: string;
  user_id?: string;
  rating: number;
  title?: string | null;
  comment: string | null;
  is_verified: boolean;
  created_at?: string;
  date_label?: string;
  reviewer_name: string;
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = slug === 'electric-coconut-scraper' ? 'electric-coconut-scraper-pro' : (slug ?? '');
  const { product, loading } = useProduct(normalizedSlug);
  const { products: related } = useProducts({ limit: 8 });
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [added, setAdded] = useState(false);

  const isScraperProduct = Boolean(
    slug?.includes('coconut-scraper') || product?.slug?.includes('coconut-scraper') || product?.id === 'prod-5'
  );

  const [reviews, setReviews] = useState<Review[]>(() =>
    OFFICIAL_SCRAPER_REVIEWS.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      is_verified: true,
      date_label: r.date_label,
      reviewer_name: r.reviewer_name,
    }))
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    name: localStorage.getItem('ww_reviewer_name') || '',
    email: localStorage.getItem('ww_reviewer_email') || '',
    saveInfo: Boolean(localStorage.getItem('ww_reviewer_name')),
  });
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    setSelectedImage(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    if (product?.id) loadReviews();
  }, [product?.id]);

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
      const targetKey = isScraperProduct ? 'electric-coconut-scraper-pro' : product.id;
      const res = await apiClient.get(`/products/${targetKey}/reviews`);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped: Review[] = data.map((r: any, idx: number) => ({
          id: String(r.id || r._id || `rev-${idx + 1}`),
          user_id: r.user_id,
          rating: Number(r.rating) || 5,
          title: r.title,
          comment: r.comment,
          is_verified: r.is_verified !== false,
          created_at: r.created_at || new Date().toISOString(),
          date_label:
            r.date_label ||
            (r.created_at
              ? new Date(r.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''),
          reviewer_name: r.reviewer_name || 'Customer',
        }));
        setReviews(mapped);
        if (user) {
          const mine = mapped.find(r => r.user_id === user.id) ?? null;
          setMyReview(mine);
        }
      }
    } catch {}
    setReviewsLoading(false);
  }

  async function submitReview() {
    if (!product?.id) return;
    const finalName = (reviewForm.name || user?.full_name || '').trim();
    const finalEmail = (reviewForm.email || user?.email || '').trim();
    if (!reviewForm.comment.trim()) { toast.error('Please write a review comment'); return; }
    if (!finalName) { toast.error('Please enter your name'); return; }
    if (!finalEmail || !finalEmail.includes('@')) { toast.error('Please enter a valid email'); return; }

    if (reviewForm.saveInfo) {
      localStorage.setItem('ww_reviewer_name', finalName);
      localStorage.setItem('ww_reviewer_email', finalEmail);
    } else {
      localStorage.removeItem('ww_reviewer_name');
      localStorage.removeItem('ww_reviewer_email');
    }

    const sanitize = (s: string) => s.replace(/[<>]/g, '').trim().slice(0, 1000);
    setSubmitting(true);
    try {
      const targetKey = isScraperProduct ? 'electric-coconut-scraper-pro' : product.id;
      const payload = {
        product_id: targetKey,
        user_id: user?.id,
        rating: reviewForm.rating,
        title: sanitize(reviewForm.title) || null,
        comment: sanitize(reviewForm.comment),
        reviewer_name: finalName,
        reviewer_email: finalEmail,
        is_verified: true,
      };
      const res = await apiClient.post(`/products/${targetKey}/reviews`, payload);
      if (!res.data?.success && res.status !== 200 && res.status !== 201) {
        throw new Error(res.data?.message || 'Failed');
      }
      toast.success('Review submitted! Thank you.');
      setReviewForm(f => ({ ...f, comment: '' }));
      await loadReviews();
    } catch (err: any) { toast.error(err.message ?? 'Failed to submit review'); }
    finally { setSubmitting(false); }
  }

  async function deleteReview() {
    if (!myReview || !product?.id) return;
    try {
      await apiClient.delete(`/products/${product.id}/reviews/${myReview.id}`);
      toast.success('Review deleted');
      setMyReview(null);
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
          <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3 rounded-2xl bg-secondary/50 p-4">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              ₹{(product.price || 0).toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && (
              <span className="text-base sm:text-lg text-muted-foreground line-through">
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
            <div className="flex flex-wrap items-center gap-3">
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
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 sm:gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">Express Shipping (₹199)</span>
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
      <div className="mt-10 sm:mt-14">
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {[
            ['description', 'Description'],
            ['specs', 'Specifications'],
            ['reviews', `Reviews (${reviews.length})`],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`border-b-2 px-3.5 sm:px-6 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
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
                  <h3 className="font-bold text-foreground text-lg">Customer Reviews ({reviews.length})</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Rated 5.0 out of 5 based on {reviews.length} customer reviews</p>
                </div>
                {!showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Add a Review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground">Add a review</h4>
                      <button onClick={() => setShowReviewForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Hide</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your email address will not be published. Required fields are marked <span className="text-red-500 font-bold">*</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Your rating *</label>
                    <div className="flex gap-1 items-center">
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
                      <span className="ml-2 text-xs font-bold text-primary">
                        {reviewForm.rating === 5 ? 'Perfect' : reviewForm.rating === 4 ? 'Good' : reviewForm.rating === 3 ? 'Average' : reviewForm.rating === 2 ? 'Not that bad' : 'Very poor'} ({reviewForm.rating}/5)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Your review *</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      rows={3}
                      placeholder="Share your experience with this product..."
                      className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Name *</label>
                      <input
                        type="text"
                        value={reviewForm.name}
                        onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your Name"
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email *</label>
                      <input
                        type="email"
                        value={reviewForm.email}
                        onChange={e => setReviewForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reviewForm.saveInfo}
                      onChange={e => setReviewForm(f => ({ ...f, saveInfo: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 accent-primary rounded"
                    />
                    <span className="text-xs text-muted-foreground">
                      Save my name, email, and website in this browser for the next time I comment.
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews list */}
              {reviewsLoading && reviews.length === 0 ? (
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
                        <div>
                          <span className="font-bold text-sm text-foreground">{r.reviewer_name}</span>
                          {r.date_label && (
                            <span className="text-xs text-muted-foreground ml-2">– {r.date_label}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground">Rated {r.rating} out of 5</span>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.comment}</p>}
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
