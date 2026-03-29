import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Minus, Plus, Check, Truck, Shield, RotateCcw, User, ThumbsUp } from 'lucide-react';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
    if (activeTab === 'reviews' && product?.id) loadReviews();
  }, [activeTab, product?.id]);

  useEffect(() => {
    if (!user || !product?.id) return;
    supabase
      .from('order_items')
      .select('id, orders!inner(user_id, status)')
      .eq('product_id', product.id)
      .eq('orders.user_id', user.id)
      .neq('orders.status', 'cancelled')
      .limit(1)
      .then(({ data }) => setHasPurchased((data?.length ?? 0) > 0));
  }, [user, product?.id]);

  async function loadReviews() {
    if (!product?.id) return;
    setReviewsLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('id, user_id, rating, title, comment, is_verified, created_at, reviewer_name')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });

    const mapped: Review[] = (data ?? []).map((r: any) => ({
      id: r.id, user_id: r.user_id, rating: r.rating,
      title: r.title, comment: r.comment, is_verified: r.is_verified,
      created_at: r.created_at, reviewer_name: r.reviewer_name || 'Customer',
    }));
    setReviews(mapped);
    if (user) {
      const mine = mapped.find(r => r.user_id === user.id) ?? null;
      setMyReview(mine);
      if (mine) setReviewForm({ rating: mine.rating, title: mine.title ?? '', comment: mine.comment ?? '' });
    }
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
        const { error } = await supabase.from('reviews')
          .update({ rating: payload.rating, title: payload.title, comment: payload.comment })
          .eq('id', myReview.id);
        if (error) throw error;
        toast.success('Review updated!');
      } else {
        const { error } = await supabase.from('reviews').insert(payload);
        if (error) { if (error.code === '23505') toast.error('You already reviewed this product'); else throw error; return; }
        toast.success('Review submitted! Thank you.');
      }
      setShowReviewForm(false);
      await loadReviews();
    } catch (err: any) { toast.error(err.message ?? 'Failed to submit review'); }
    finally { setSubmitting(false); }
  }

  async function deleteReview() {
    if (!myReview) return;
    const { error } = await supabase.from('reviews').delete().eq('id', myReview.id);
    if (error) { toast.error('Failed to delete review'); return; }
    toast.success('Review deleted');
    setMyReview(null); setShowReviewForm(false);
    setReviewForm({ rating: 5, title: '', comment: '' });
    await loadReviews();
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-2 animate-pulse">
          <div className="aspect-square rounded-xl bg-secondary" />
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
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <Link to="/shop" className="mt-4 inline-block text-primary hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const relatedProducts = related.filter((p: any) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);
  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_at_price ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  function handleAddToCart() {
    addItem(product!, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="container py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link><span>/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link><span>/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
            <img src={product.images?.[selectedImage] ?? product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === selectedImage ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {product.category_name && (
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{product.category_name}</span>
          )}
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{product.name}</h1>

          <button className="flex items-center gap-2" onClick={() => setActiveTab('reviews')}>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
            <span className="text-sm text-primary hover:underline">({product.review_count} reviews)</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
            {product.compare_at_price && (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">{discount}% OFF</span>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{product.short_description}</p>

          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border border-input">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={handleAddToCart}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-all ${added ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                {added ? <><Check className="h-4 w-4" />Added!</> : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
              </button>
              <button onClick={() => toggleItem(product!)}
                className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-input hover:bg-secondary'}`}>
                <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-secondary/50 p-4">
            {[{ icon: Truck, label: 'Free Shipping', sub: 'Orders ₹999+' }, { icon: Shield, label: 'Secure Pay', sub: 'Razorpay' }, { icon: RotateCcw, label: '7-Day Return', sub: 'Easy process' }].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon className="h-5 w-5 text-primary" />
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b border-border">
          {(['description', 'specs', 'reviews'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab === 'reviews' ? `Reviews (${product.review_count})` : tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'description' && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{product.description}</p>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl divide-y divide-border rounded-xl border border-border overflow-hidden">
              {Object.entries(product.specifications ?? {}).length > 0
                ? Object.entries(product.specifications ?? {}).map(([k, v]) => (
                    <div key={k} className="flex items-center px-4 py-3 bg-card">
                      <span className="w-40 text-xs font-semibold text-muted-foreground shrink-0">{k}</span>
                      <span className="text-sm text-foreground">{v as string}</span>
                    </div>
                  ))
                : <p className="px-4 py-6 text-sm text-muted-foreground">No specifications available.</p>
              }
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 max-w-3xl">
              {/* Rating Overview */}
              {reviews.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-8 rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col items-center justify-center min-w-[120px]">
                    <span className="text-5xl font-black text-foreground">{product.rating}</span>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{product.review_count} reviews</span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingDist.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs w-4 text-right text-muted-foreground font-medium">{star}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400 transition-all"
                            style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-4">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Write Review CTA */}
              {user && !showReviewForm && (
                <button onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all">
                  <Star className="h-4 w-4" />{myReview ? 'Edit Your Review' : 'Write a Review'}
                </button>
              )}
              {!user && (
                <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                  <Link to="/auth" className="font-bold text-primary hover:underline">Sign in</Link> to write a review.
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && user && (
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{myReview ? 'Edit Your Review' : 'Write a Review'}</h3>
                    <button onClick={() => setShowReviewForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                  {hasPurchased && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <ThumbsUp className="h-3.5 w-3.5" />Verified Purchase — Your review will be marked as verified
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Your Rating *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} type="button"
                          onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                          className="transition-transform hover:scale-110">
                          <Star className={`h-7 w-7 transition-colors ${(hoverStar || reviewForm.rating) >= s ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Review Title <span className="font-normal normal-case">(optional)</span></label>
                    <input value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      maxLength={100} placeholder="Summarize your experience"
                      className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Your Review *</label>
                    <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      rows={4} maxLength={500} placeholder="Share your honest experience with this product..."
                      className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none" />
                    <p className="text-[10px] text-muted-foreground text-right mt-1">{reviewForm.comment.length}/500</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={submitReview} disabled={submitting}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all">
                      {submitting ? 'Submitting…' : myReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    {myReview && (
                      <button onClick={deleteReview}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-xl border border-border p-5 animate-pulse space-y-3">
                      <div className="flex gap-3"><div className="h-9 w-9 rounded-full bg-secondary" /><div className="space-y-1.5 flex-1"><div className="h-3 w-24 rounded bg-secondary" /><div className="h-3 w-16 rounded bg-secondary" /></div></div>
                      <div className="h-3 rounded bg-secondary w-full" /><div className="h-3 rounded bg-secondary w-4/5" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-10 text-center">
                  <Star className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="font-semibold text-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className={`rounded-xl border bg-card p-5 space-y-3 ${review.user_id === user?.id ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{review.reviewer_name}</p>
                              {review.user_id === user?.id && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>}
                              {review.is_verified && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                  <ThumbsUp className="h-2.5 w-2.5" />Verified
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{format(new Date(review.created_at), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="text-sm font-semibold text-foreground">{review.title}</p>}
                      {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                      {review.user_id === user?.id && !showReviewForm && (
                        <button onClick={() => setShowReviewForm(true)} className="text-xs text-primary font-semibold hover:underline">Edit your review</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-foreground mb-6">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
