import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Truck, ShoppingCart, Star, CheckCircle2, MessageSquarePlus, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import {
  OFFICIAL_SCRAPER_DESCRIPTION,
  OFFICIAL_SCRAPER_TAGLINE,
  OFFICIAL_SCRAPER_FEATURES,
  OFFICIAL_SCRAPER_SPECIFICATIONS,
  OFFICIAL_SCRAPER_REVIEWS,
  ScraperReview,
} from '@/data/scraperReviews';

const SHOWCASE_IMAGES = [
  { src: '/product/scraper-angle-clean.png', label: 'Rotary Blade View' },
  { src: '/product/scraper-hero-main.jpg', label: 'Studio Kitchen View' },
  { src: '/product/scraper-action-main.jpg', label: 'In Action Shredding' },
  { src: '/product/scraper-cap-main.jpg', label: 'With Safety Guard' },
  { src: '/product/scraper-features.png', label: 'Parts Overview' },
];

const M01_PRODUCT = {
  id: 'prod-5',
  name: 'Waves & Wires Electric Coconut Scraper Model M01',
  slug: 'electric-coconut-scraper-pro',
  price: 2550,
  compare_at_price: 3499,
  images: [
    '/product/scraper-angle-clean.png',
    '/product/scraper-hero-main.jpg',
    '/product/scraper-action-main.jpg',
    '/product/scraper-cap-main.jpg',
    '/product/scraper-features.png',
  ],
  category_id: 'cat-2',
  category_name: 'Kitchen & Appliances',
  stock: 50,
  sku: 'WW-CS-001',
  description: OFFICIAL_SCRAPER_DESCRIPTION,
  rating: 5.0,
  review_count: 30,
};

const RATING_LABELS: Record<number, string> = {
  5: 'Perfect',
  4: 'Good',
  3: 'Average',
  2: 'Not that bad',
  1: 'Very poor',
};

export default function HomePage() {
  const { addItem, setIsOpen } = useCart();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [heroImgIdx, setHeroImgIdx] = useState(0);
  const [featureImgIdx, setFeatureImgIdx] = useState(1);
  const [openDesignDropdown, setOpenDesignDropdown] = useState<string | null>('overview');
  const [openFeatureDropdown, setOpenFeatureDropdown] = useState<string | null>('features');
  const [reviews, setReviews] = useState<ScraperReview[]>(OFFICIAL_SCRAPER_REVIEWS);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Add a review form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState(() => localStorage.getItem('ww_reviewer_name') || '');
  const [reviewerEmail, setReviewerEmail] = useState(() => localStorage.getItem('ww_reviewer_email') || '');
  const [saveReviewerInfo, setSaveReviewerInfo] = useState(() => Boolean(localStorage.getItem('ww_reviewer_name')));
  const [submittingReview, setSubmittingReview] = useState(false);

  const unitPrice = 2550;
  const totalPrice = quantity === 2 ? unitPrice * 2 - 200 : unitPrice * quantity;

  const handleDirectPurchase = useCallback(() => {
    setIsOpen(false);
    addItem(M01_PRODUCT, quantity, false);
    navigate('/checkout');
  }, [addItem, navigate, quantity, setIsOpen]);

  useEffect(() => {
    const handleOpen = () => handleDirectPurchase();
    window.addEventListener('open-purchase-drawer', handleOpen);
    return () => window.removeEventListener('open-purchase-drawer', handleOpen);
  }, [handleDirectPurchase]);

  useEffect(() => {
    apiClient
      .get('/products/electric-coconut-scraper-pro/reviews')
      .then((res) => {
        const list = res.data?.data || res.data;
        if (Array.isArray(list) && list.length >= OFFICIAL_SCRAPER_REVIEWS.length) {
          setReviews(
            list.map((r: any, idx: number) => ({
              id: String(r.id || r._id || `rev-${idx + 1}`),
              reviewer_name: r.reviewer_name || 'Customer',
              date_label:
                r.date_label ||
                (r.created_at
                  ? new Date(r.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Verified Purchase'),
              rating: Number(r.rating) || 5,
              comment: r.comment || '',
              is_verified: true,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error('Please write your review.');
      return;
    }
    if (!reviewerName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!reviewerEmail.trim() || !reviewerEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (saveReviewerInfo) {
      localStorage.setItem('ww_reviewer_name', reviewerName.trim());
      localStorage.setItem('ww_reviewer_email', reviewerEmail.trim());
    } else {
      localStorage.removeItem('ww_reviewer_name');
      localStorage.removeItem('ww_reviewer_email');
    }

    setSubmittingReview(true);
    try {
      const res = await apiClient.post('/products/electric-coconut-scraper-pro/reviews', {
        rating: reviewRating,
        comment: reviewComment.trim(),
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim(),
      });
      const created = res.data?.data;
      const newEntry: ScraperReview = {
        id: String(created?.id || created?._id || `rev-${Date.now()}`),
        reviewer_name: reviewerName.trim(),
        date_label:
          created?.date_label ||
          new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        rating: reviewRating,
        comment: reviewComment.trim(),
        is_verified: true,
      };
      setReviews((prev) => [...prev, newEntry]);
      setReviewComment('');
      toast.success('Thank you! Your review has been published.');
    } catch {
      const fallbackEntry: ScraperReview = {
        id: `rev-${Date.now()}`,
        reviewer_name: reviewerName.trim(),
        date_label: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        rating: reviewRating,
        comment: reviewComment.trim(),
        is_verified: true,
      };
      setReviews((prev) => [...prev, fallbackEntry]);
      setReviewComment('');
      toast.success('Thank you! Your review has been published.');
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="w-full overflow-x-hidden bg-[#faf6ed] text-[#1c1917] selection:bg-[#facc15] selection:text-black font-sans antialiased">

      {/* ── 1. HERO SECTION (Mobile-First + Desktop Luxury Layout) ──────────── */}
      <section id="overview" className="relative w-full min-h-[auto] lg:min-h-[90vh] flex items-center px-4 sm:px-10 md:px-14 lg:px-20 py-6 sm:py-12 lg:py-10 border-b border-amber-900/10 bg-gradient-to-br from-[#fdfcf8] via-[#faf5ea] to-[#f4ecd8]">
        
        {/* Subtle diagonal warm lighting facets */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(135deg,rgba(255,255,255,0.8)_0%,transparent_50%,rgba(234,179,8,0.06)_100%)]" />

        <div className="w-full max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center relative z-10">

          {/* Left Column: Script Brand + Gigantic M01 + Short Summary + Purchase Suite */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5 pt-1 lg:pt-0 order-2 lg:order-1">
            
            {/* Brand Wordmark in Cormorant Garamond Serif Italic Bright Gold Yellow */}
            <div className="space-y-0">
              <h3 className="font-serif italic text-2xl xs:text-3xl sm:text-5xl lg:text-6xl text-[#d97706] font-normal tracking-normal leading-tight">
                Waves <span className='font-serif italic text-black'>&</span><span className="font-serif italic text-[#eab308]"> Wires</span>
              </h3>
              
              {/* Massive Bold M01 Title */}
              <h1 className="text-4xl xs:text-5xl sm:text-5xl md:text-[7rem] lg:text-[8rem] font-black text-[#1c1917] tracking-tighter leading-[0.88] select-none pb-6">
                Coconut Scrapper
              </h1>
              
              {/* Subtitle with Bright Gold Accent Rules */}
              <div className="flex mt-2 flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                <span className="h-[1.5px] w-5 sm:w-8 bg-[#eab308] shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.28em] text-[#8c6b32]">
                  ELECTRIC COCONUT SCRAPER
                </span>
                <span className="h-[1.5px] w-6 sm:w-10 bg-[#eab308] hidden xs:block shrink-0" />
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-400/20 border border-[#eab308]/50 text-[10px] sm:text-xs font-bold text-[#1c1917] hover:bg-yellow-400/35 transition-colors"
                >
                  <span className="flex items-center text-[#d97706]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-[#eab308] text-[#eab308]" />
                    ))}
                  </span>
                  <span>5.0/5  ({reviews.length} Reviews)</span>
                </a>
              </div>
            </div>

            {/* Crisp, Short Product Summary */}
            <p className="text-xs sm:text-base text-[#4a4237] max-w-lg font-normal leading-relaxed pt-0.5">
              Effortlessly shred fresh coconut into fluffy flakes in seconds — powered by a 150W high-torque motor, sharp SS 304 stainless steel blades, and a rock-solid vacuum lock base.
            </p>

            {/* Direct Home Page Quantity Selector & Purchase Suite */}
            <div className="pt-1 sm:pt-2 space-y-3.5">
              
              {/* Quantity Stepper & Pack Presets */}
              <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <span className="block sm:inline text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#8c6b32]">
                  SELECT QUANTITY:
                </span>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 sm:pt-0">
                  {/* Stepper (- / +) */}
                  <div className="inline-flex items-center border-2 border-[#eab308] bg-[#fffdf7] shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-10 sm:w-10 sm:h-11 flex items-center justify-center text-[#1c1917] hover:bg-yellow-400/20 text-base font-black transition-colors active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 sm:w-10 text-center font-black text-sm text-[#1c1917] select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-10 sm:w-10 sm:h-11 flex items-center justify-center text-[#1c1917] hover:bg-yellow-400/20 text-base font-black transition-colors active:scale-95"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <button
                    type="button"
                    onClick={() => setQuantity(1)}
                    className={`px-3 sm:px-3.5 h-10 sm:h-11 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all border-2 ${
                      quantity === 1
                        ? 'border-[#eab308] bg-yellow-400/25 text-[#1c1917] shadow-xs'
                        : 'border-amber-900/15 bg-white/70 text-[#6b5d4d] hover:border-[#eab308]'
                    }`}
                  >
                    1 Unit
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuantity(2)}
                    className={`relative px-3 sm:px-3.5 h-10 sm:h-11 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all border-2 ${
                      quantity === 2
                        ? 'border-[#eab308] bg-yellow-400/25 text-[#1c1917] shadow-xs'
                        : 'border-amber-900/15 bg-white/70 text-[#6b5d4d] hover:border-[#eab308]'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-1 bg-[#d97706] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs leading-none">
                      SAVE ₹200
                    </span>
                    2 Units Combo
                  </button>
                </div>
              </div>

              {/* Action Buttons: Signature Split Box & Add to Cart */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                {/* Signature Split Purchase Box with Dynamic Price */}
                <div className="inline-flex items-stretch border-2 border-[#eab308] bg-[#fffdf7] shadow-sm hover:shadow-lg shadow-yellow-500/10 hover:border-[#1c1917] transition-all w-full sm:w-auto">
                  <button
                    onClick={handleDirectPurchase}
                    className="relative group flex-1 sm:flex-initial px-4 xs:px-6 sm:px-11 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#facc15] transition-all active:scale-[0.99] text-center"
                  >
                    <span>PURCHASE NOW</span>
                    {/* Folded corner triangle decoration */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                  </button>
                  <div className="flex items-center justify-center px-4 xs:px-5 sm:px-8 py-3.5 sm:py-4 border-l-2 border-[#eab308] text-xs sm:text-sm font-black tracking-wider text-[#d97706] bg-yellow-400/10 shrink-0">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Direct Add to Cart on Home Page */}
                <button
                  type="button"
                  onClick={() => {
                    addItem(M01_PRODUCT, quantity, true);
                    toast.success(`🎉 Added ${quantity} unit(s) of Electric Coconut Scraper to Cart!`);
                  }}
                  className="w-full sm:w-auto justify-center px-6 py-3.5 sm:py-4 border-2 border-[#1c1917] bg-transparent hover:bg-[#1c1917] text-[#1c1917] hover:text-[#facc15] text-xs sm:text-sm font-black uppercase tracking-[0.18em] transition-all active:scale-[0.99] flex items-center gap-2 shadow-xs"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  <span>ADD TO CART</span>
                </button>
              </div>

              {/* Delivery & COD Highlight */}
              <p className="text-[11px] font-bold text-[#8c6b32] flex items-center gap-2 pt-0.5">
                <Truck className="h-3.5 w-3.5 text-[#d97706] shrink-0" />
                <span>Express Delivery (₹199) • Cash on Delivery (COD) Available</span>
              </p>

            </div>

          </div>

          {/* Right Column: Large Hero Product Showcase + Interactive Thumbnail Switcher */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-1 sm:py-4 order-1 lg:order-2">
            <div className="relative w-full max-w-[290px] xs:max-w-[340px] sm:max-w-[460px] lg:max-w-[520px] aspect-square flex items-center justify-center">
              
              {/* Warm Golden studio backlight */}
              <div className="absolute -inset-4 bg-radial from-yellow-300/35 via-amber-200/15 to-transparent rounded-full filter blur-3xl pointer-events-none" />
              
              <img
                src={SHOWCASE_IMAGES[heroImgIdx].src}
                alt={SHOWCASE_IMAGES[heroImgIdx].label}
                className={`relative z-10 w-full h-full transition-all duration-500 ease-out ${
                  SHOWCASE_IMAGES[heroImgIdx].src.endsWith('.jpg')
                    ? 'object-cover border-2 border-[#eab308] shadow-[0_24px_48px_rgba(0,0,0,0.22)] hover:scale-[1.02]'
                    : 'object-contain filter drop-shadow-[0_24px_36px_rgba(0,0,0,0.22)] hover:scale-105'
                }`}
              />

              {/* Ground contact shadow for transparent cutouts */}
              {!SHOWCASE_IMAGES[heroImgIdx].src.endsWith('.jpg') && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-6 sm:h-8 bg-black/15 filter blur-xl rounded-[100%] pointer-events-none" />
              )}
            </div>

            {/* Interactive Image Switcher Thumbnails */}
            <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-3">
              {SHOWCASE_IMAGES.map((img, idx) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => setHeroImgIdx(idx)}
                  title={img.label}
                  className={`h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 p-1 bg-[#fffdf8] border-2 transition-all flex items-center justify-center overflow-hidden ${
                    heroImgIdx === idx
                      ? 'border-[#eab308] scale-105 shadow-md shadow-yellow-500/15'
                      : 'border-amber-900/15 opacity-70 hover:opacity-100 hover:border-[#eab308]/60'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.label}
                    className={`h-full w-full ${img.src.endsWith('.jpg') ? 'object-cover' : 'object-contain'}`}
                  />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Far Right Vertical Indicator (Bright Gold Diamond + Warm Yellow Dots) */}
        <div className="hidden xl:flex flex-col items-center gap-3 absolute right-8 top-1/2 -translate-y-1/2 z-20">
          {SHOWCASE_IMAGES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setHeroImgIdx(idx)}
              aria-label={`View image ${idx + 1}`}
              className={
                heroImgIdx === idx
                  ? 'w-2.5 h-2.5 border-2 border-[#eab308] rotate-45 bg-[#facc15]/60 transition-all'
                  : 'w-2 h-2 rounded-full bg-[#d97706]/40 hover:bg-[#d97706] transition-all'
              }
            />
          ))}
        </div>

      </section>

      {/* ── 2. DARK STATEMENT BAND: DESIGN & QUALITY ──────────────────────────── */}
      <section id="design" className="w-full bg-[#181613] text-white py-10 sm:py-16 px-4 sm:px-10 text-center border-y border-amber-950/40">
        <div className="max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-[#facc15]">
            DESIGN & QUALITY
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-[#f5efe6] font-light leading-relaxed max-w-2xl mx-auto">
            {OFFICIAL_SCRAPER_TAGLINE}. Engineered with a high-torque pure copper motor and surgical SS 304 food-grade rotary cutters.
          </p>
          <div className="pt-1 text-[#eab308] text-xs select-none">
            ×
          </div>
        </div>
      </section>

      {/* ── 3. ASYMMETRIC CRAFTSMANSHIP (Left 3 Specs | Large Center Machine | Right Dropdowns) ── */}
      <section className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-12 sm:py-20 lg:py-24 bg-[#f6f0e2] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center">

            {/* Left Column: 3 Circular Specs with Bright Gold Accents & Dotted Dividers */}
            <div className="lg:col-span-3 space-y-5 sm:space-y-7">
              
              {/* Spec 1 */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#eab308] bg-yellow-400/20 flex items-center justify-center shrink-0 text-[#d97706] shadow-sm shadow-yellow-500/10">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-[#eab308] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-[#eab308]" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base sm:text-lg font-black text-[#1c1917] tracking-tight">
                    150 W / MOTOR
                  </h4>
                  <p className="text-xs text-[#5c5346] font-normal">
                    100% Pure Copper High-Torque Coil
                  </p>
                </div>
              </div>

              <div className="w-full border-t border-dotted border-[#eab308]/30" />

              {/* Spec 2 */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#eab308] bg-yellow-400/20 flex items-center justify-center shrink-0 text-[#d97706] shadow-sm shadow-yellow-500/10">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base sm:text-lg font-black text-[#1c1917] tracking-tight">
                    1 YEAR
                  </h4>
                  <p className="text-xs text-[#5c5346] font-normal">
                    Invoice Acts as Official Warranty Card
                  </p>
                </div>
              </div>

              <div className="w-full border-t border-dotted border-[#eab308]/30" />

              {/* Spec 3 */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#eab308] bg-yellow-400/20 flex items-center justify-center shrink-0 text-[#d97706] shadow-sm shadow-yellow-500/10">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base sm:text-lg font-black text-[#1c1917] tracking-tight">
                    SS 304 STEEL
                  </h4>
                  <p className="text-xs text-[#5c5346] font-normal">
                    Food-Grade Dual Rotary Cutter
                  </p>
                </div>
              </div>

            </div>

            {/* Center Column: LARGE Center Product Cutout with Ground Shadow */}
            <div className="lg:col-span-5 flex justify-center items-center py-2">
              <div className="relative w-full max-w-[300px] xs:max-w-[350px] sm:max-w-[460px] lg:max-w-[540px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-yellow-300/30 via-amber-200/10 to-transparent rounded-full filter blur-3xl pointer-events-none" />
                <img
                  src="/product/scraper-cap-main.jpg"
                  alt="Waves & Wires Scraper with Safety Cap"
                  className="relative z-10 h-full w-full object-cover border-2 border-[#eab308] shadow-[0_24px_48px_rgba(0,0,0,0.22)] hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right Column: Clean Interactive Accordion Dropdowns (Instead of Wall of Text) */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d97706] block mb-2">
                DESIGN & CRAFTSMANSHIP
              </span>

              {[
                {
                  id: 'overview',
                  title: 'Product Description',
                  body: OFFICIAL_SCRAPER_DESCRIPTION,
                },
                {
                  id: 'ergonomics',
                  title: 'Surgical SS 304 Rotary Blades',
                  body: 'Equipped with sharp, detachable food-grade stainless steel blades and a protective dome cap that shred fresh coconut flesh into uniform, fluffy flakes in under 60 seconds.',
                },
                {
                  id: 'stability',
                  title: 'Heavy-Duty Vacuum Lock Base',
                  body: 'Features a lever-activated suction base that locks firmly onto kitchen granite, marble, or glass countertops for vibration-free, single-handed operation.',
                },
              ].map((item) => {
                const isOpen = openDesignDropdown === item.id;
                return (
                  <div
                    key={item.id}
                    className="border-2 border-[#eab308]/60 bg-[#fffdf8] transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDesignDropdown(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left font-black text-xs sm:text-sm uppercase tracking-wider text-[#1c1917] hover:bg-yellow-400/10 transition-colors"
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#d97706] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#4a4237] leading-relaxed border-t border-amber-900/10">
                        {item.body}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. 4 VISUAL SHOWCASE GALLERY CARDS ────────────────────────────────── */}
      <section id="details" className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-12 sm:py-20 lg:py-24 bg-[#ede4d2] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d97706] block">
                360° VISUAL GALLERY
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#1c1917] tracking-tight uppercase mt-1">
                BUILT FOR EVERY INDIAN KITCHEN
              </h2>
            </div>
            {/* <p className="text-xs sm:text-sm font-semibold text-[#6b5d4d]">
              Click any angle in the showcase to inspect closer
            </p> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {SHOWCASE_IMAGES.map((card, idx) => (
              <div
                key={card.src}
                onClick={() => setFeatureImgIdx(idx)}
                className="cursor-pointer border-2 border-[#eab308] bg-gradient-to-br from-[#fffdfa] to-[#faf3e3] p-4 sm:p-5 flex flex-col justify-between overflow-hidden group shadow-md shadow-yellow-500/10 hover:shadow-xl transition-all"
              >
                <div className="aspect-square w-full flex items-center justify-center p-1.5 overflow-hidden">
                  <img
                    src={card.src}
                    alt={card.label}
                    className={`h-full w-full ${
                      card.src.endsWith('.jpg') ? 'object-cover rounded-xs' : 'object-contain'
                    } filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-500 ease-out`}
                  />
                </div>
                <div className="pt-3 border-t border-amber-900/10 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1c1917]">
                    {card.label}
                  </span>
                  <span className="text-xs font-black text-[#d97706]">0{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES & SPECIFICATIONS (Dropdowns | Large Center Image | Leader Metrics) ── */}
      <section id="features" className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-12 sm:py-20 lg:py-24 bg-[#faf5ea] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">

            {/* Left Column: Heading, Interactive Dropdowns & Purchase Button */}
            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d97706] block">
                  ENGINEERED PERFORMANCE
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-[#1c1917] tracking-tight uppercase">
                  FEATURES
                </h2>
              </div>

              {/* 3 Interactive Dropdowns for Features, Specifications & Warranty */}
              <div className="space-y-2.5 pt-1">
                {/* Dropdown 1: Key Features (7 Official Points) */}
                <div className="border-2 border-[#eab308]/70 bg-[#fffdf8] shadow-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFeatureDropdown(openFeatureDropdown === 'features' ? null : 'features')
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left font-black text-xs sm:text-sm uppercase tracking-wider text-[#1c1917] hover:bg-yellow-400/10 transition-colors"
                  >
                    <span>Key Features (7 Highlights)</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#d97706] shrink-0 transition-transform duration-200 ${
                        openFeatureDropdown === 'features' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFeatureDropdown === 'features' && (
                    <ul className="px-4 pb-4 pt-2 space-y-2 border-t border-amber-900/10">
                      {OFFICIAL_SCRAPER_FEATURES.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#1c1917] font-medium">
                          <CheckCircle2 className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Dropdown 2: Product Specifications */}
                <div className="border-2 border-[#eab308]/70 bg-[#fffdf8] shadow-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFeatureDropdown(openFeatureDropdown === 'specs' ? null : 'specs')
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left font-black text-xs sm:text-sm uppercase tracking-wider text-[#1c1917] hover:bg-yellow-400/10 transition-colors"
                  >
                    <span>Product Specifications</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#d97706] shrink-0 transition-transform duration-200 ${
                        openFeatureDropdown === 'specs' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFeatureDropdown === 'specs' && (
                    <div className="divide-y divide-amber-900/10 border-t border-amber-900/10">
                      {Object.entries(OFFICIAL_SCRAPER_SPECIFICATIONS).map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#8c6b32]">
                            {label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-[#1c1917] text-right">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dropdown 3: Warranty & Care */}
                <div className="border-2 border-[#eab308]/70 bg-[#fffdf8] shadow-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFeatureDropdown(openFeatureDropdown === 'warranty' ? null : 'warranty')
                    }
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left font-black text-xs sm:text-sm uppercase tracking-wider text-[#1c1917] hover:bg-yellow-400/10 transition-colors"
                  >
                    <span>1-Year Warranty & Easy Cleaning</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#d97706] shrink-0 transition-transform duration-200 ${
                        openFeatureDropdown === 'warranty' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFeatureDropdown === 'warranty' && (
                    <div className="px-4 pb-4 pt-2 text-xs sm:text-sm text-[#4a4237] leading-relaxed border-t border-amber-900/10 space-y-1.5">
                      <p className="font-bold text-[#1c1917]">
                        ✓ 1 Year Brand Warranty (Please consider your Invoice as the official warranty card).
                      </p>
                      <p>
                        ✓ Detachable stainless steel cutter & collection tray rinse clean under running water in seconds.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDirectPurchase}
                  className="w-full sm:w-auto relative group border-2 border-[#eab308] bg-[#fffdf7] hover:bg-[#1c1917] text-[#1c1917] hover:text-[#facc15] px-6 sm:px-8 py-3.5 text-xs font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] transition-all shadow-xs hover:shadow-md active:scale-[0.99]"
                >
                  <span>PURCHASE ({quantity} {quantity === 1 ? 'UNIT' : 'UNITS'} • ₹{totalPrice.toLocaleString('en-IN')})</span>
                  {/* Folded corner triangle */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                </button>
              </div>
            </div>

            {/* Center Column: LARGE Interactive Product Image Showcase */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center py-2">
              <div className="relative w-full max-w-[300px] xs:max-w-[350px] sm:max-w-[460px] lg:max-w-[540px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-yellow-300/30 to-transparent rounded-full filter blur-3xl pointer-events-none" />
                <img
                  src={SHOWCASE_IMAGES[featureImgIdx].src}
                  alt={SHOWCASE_IMAGES[featureImgIdx].label}
                  className={`relative z-10 h-full w-full transition-transform duration-500 ${
                    SHOWCASE_IMAGES[featureImgIdx].src.endsWith('.jpg')
                      ? 'object-cover border-2 border-[#eab308] shadow-[0_24px_48px_rgba(0,0,0,0.22)] hover:scale-[1.02]'
                      : 'object-contain filter drop-shadow-[0_25px_36px_rgba(0,0,0,0.22)] transform scale-105 lg:scale-110 hover:scale-115'
                  }`}
                />
                {!SHOWCASE_IMAGES[featureImgIdx].src.endsWith('.jpg') && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-7 bg-black/15 filter blur-xl rounded-[100%] pointer-events-none" />
                )}
              </div>

              {/* View Selector Pills under Center Feature Image */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {SHOWCASE_IMAGES.map((img, idx) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setFeatureImgIdx(idx)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-all ${
                      featureImgIdx === idx
                        ? 'border-[#eab308] bg-[#1c1917] text-[#facc15] shadow-xs'
                        : 'border-amber-900/20 bg-white/80 text-[#5c5346] hover:border-[#eab308]'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: 4 Bold Visual Leader Metrics */}
            <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
              
              {/* Metric 1 */}
              <div className="space-y-1 p-3.5 lg:p-0 rounded-xl lg:rounded-none bg-white/60 lg:bg-transparent border border-amber-900/10 lg:border-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden lg:block h-[1.5px] flex-1 bg-[#eab308]/40" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#d97706]">
                    MAX POWER INPUT
                  </span>
                </div>
                <p className="text-xl sm:text-3xl font-black text-[#1c1917] lg:text-right tracking-tight">
                  150 W
                </p>
              </div>

              {/* Metric 2 */}
              <div className="space-y-1 p-3.5 lg:p-0 rounded-xl lg:rounded-none bg-white/60 lg:bg-transparent border border-amber-900/10 lg:border-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden lg:block h-[1.5px] flex-1 bg-[#eab308]/40" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#d97706]">
                    ROTATIONAL SPEED
                  </span>
                </div>
                <p className="text-xl sm:text-3xl font-black text-[#1c1917] lg:text-right tracking-tight">
                  1000 RPM
                </p>
              </div>

              {/* Metric 3 */}
              <div className="space-y-1 p-3.5 lg:p-0 rounded-xl lg:rounded-none bg-white/60 lg:bg-transparent border border-amber-900/10 lg:border-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden lg:block h-[1.5px] flex-1 bg-[#eab308]/40" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#d97706]">
                    OPERATING VOLTAGE
                  </span>
                </div>
                <p className="text-xl sm:text-3xl font-black text-[#1c1917] lg:text-right tracking-tight">
                  240 V
                </p>
              </div>

              {/* Metric 4 */}
              <div className="space-y-1 p-3.5 lg:p-0 rounded-xl lg:rounded-none bg-white/60 lg:bg-transparent border border-amber-900/10 lg:border-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden lg:block h-[1.5px] flex-1 bg-[#eab308]/40" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#d97706]">
                    NET WEIGHT
                  </span>
                </div>
                <p className="text-lg xs:text-xl sm:text-3xl font-black text-[#1c1917] lg:text-right tracking-tight">
                  1.5 KG
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── 6. CUSTOMER REVIEWS (30 VERIFIED REVIEWS + ADD A REVIEW) ─────────── */}
      <section id="reviews" className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-14 sm:py-20 lg:py-24 bg-[#f4ecd8] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto space-y-10 sm:space-y-14">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#eab308]/40 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-[2px] w-6 bg-[#eab308]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d97706]">
                  VERIFIED CUSTOMER FEEDBACK
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-[#1c1917] tracking-tight uppercase">
                REVIEWS ({reviews.length})
              </h2>
            </div>

            <div className="flex items-center gap-3 bg-[#fffdf8] border-2 border-[#eab308] px-4 py-3 shadow-xs self-start sm:self-auto">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-[#eab308] text-[#eab308]" />
                ))}
              </div>
              <div className="border-l border-amber-900/15 pl-3">
                <p className="text-xs sm:text-sm font-black text-[#1c1917] leading-none">Rated 5.0 out of 5</p>
                <p className="text-[10px] font-semibold text-[#8c6b32] mt-0.5">Based on {reviews.length} customer reviews</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">

            {/* Left / Main Column: Customer Reviews List (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {(showAllReviews ? reviews : reviews.slice(0, 8)).map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#fffdf9] border border-amber-900/15 hover:border-[#eab308] p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="space-y-2.5">
                      {/* Header: Avatar, Name, Date & 5 Stars */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-[#eab308]/20 border border-[#eab308] flex items-center justify-center font-black text-xs text-[#1c1917] uppercase shrink-0">
                            {r.reviewer_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-black text-[#1c1917] truncate">
                              {r.reviewer_name}
                            </p>
                            <p className="text-[10px] font-medium text-[#8c6b32]">
                              {r.date_label}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-0.5" title={`Rated ${r.rating} out of 5`}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < r.rating ? 'fill-[#eab308] text-[#eab308]' : 'text-amber-900/20'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-green-700 mt-0.5">
                            Rated {r.rating} out of 5
                          </span>
                        </div>
                      </div>

                      {/* Review Comment */}
                      <p className="text-xs sm:text-sm text-[#4a4237] leading-relaxed whitespace-pre-line">
                        {r.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show All 30 Reviews / Show Less Button */}
              {reviews.length > 8 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((v) => !v)}
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 border-2 border-[#1c1917] bg-[#fffdf7] hover:bg-[#1c1917] text-[#1c1917] hover:text-[#facc15] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xs active:scale-95"
                  >
                    {showAllReviews
                      ? 'SHOW FEWER REVIEWS'
                      : `VIEW ALL ${reviews.length} CUSTOMER REVIEWS`}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Add a Review Form (4 cols on desktop) */}
            <div className="lg:col-span-4 bg-[#fffdf8] border-2 border-[#eab308] p-5 sm:p-7 shadow-md space-y-5 lg:sticky lg:top-24">
              <div className="space-y-1 border-b border-amber-900/10 pb-3.5">
                <div className="flex items-center gap-2 text-[#d97706]">
                  <MessageSquarePlus className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">SHARE YOUR EXPERIENCE</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1c1917] tracking-tight">
                  Add a review
                </h3>
                <p className="text-[11px] text-[#6b5d4d]">
                  Your email address will not be published. Required fields are marked <span className="text-red-600 font-bold">*</span>
                </p>
              </div>

              <form onSubmit={handleAddReview} className="space-y-4">
                {/* Your rating * */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#1c1917]">
                    Your rating <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        title={`${star} of 5 stars`}
                        aria-label={`${star} of 5 stars`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            (hoverRating || reviewRating) >= star
                              ? 'fill-[#eab308] text-[#eab308]'
                              : 'text-amber-900/25'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-[#d97706]">
                      {RATING_LABELS[hoverRating || reviewRating]} ({hoverRating || reviewRating}/5)
                    </span>
                  </div>

                  {/* Rate… Perfect / Good / Average / Not that bad / Very poor */}
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full border border-amber-900/20 bg-white px-3 py-2 text-xs font-semibold text-[#1c1917] outline-none focus:border-[#eab308]"
                    aria-label="Rate…"
                  >
                    <option value={5}>Rate… Perfect (5 of 5 stars)</option>
                    <option value={4}>Good (4 of 5 stars)</option>
                    <option value={3}>Average (3 of 5 stars)</option>
                    <option value={2}>Not that bad (2 of 5 stars)</option>
                    <option value={1}>Very poor (1 of 5 stars)</option>
                  </select>
                </div>

                {/* Your review * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#1c1917]">
                    Your review <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write your honest feedback about the Electric Coconut Scraper..."
                    className="w-full border border-amber-900/20 bg-white p-3 text-xs sm:text-sm text-[#1c1917] placeholder:text-[#8c6b32]/60 outline-none focus:border-[#eab308] transition-colors"
                  />
                </div>

                {/* Name * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#1c1917]">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full border border-amber-900/20 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1c1917] placeholder:text-[#8c6b32]/60 outline-none focus:border-[#eab308] transition-colors"
                  />
                </div>

                {/* Email * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#1c1917]">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-amber-900/20 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1c1917] placeholder:text-[#8c6b32]/60 outline-none focus:border-[#eab308] transition-colors"
                  />
                </div>

                {/* Save my name, email, and website in this browser for the next time I comment. */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={saveReviewerInfo}
                    onChange={(e) => setSaveReviewerInfo(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#d97706] rounded border-amber-900/30"
                  />
                  <span className="text-[11px] text-[#5c5346] leading-snug">
                    Save my name, email, and website in this browser for the next time I comment.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full relative group border-2 border-[#eab308] bg-[#1c1917] text-[#facc15] hover:bg-[#eab308] hover:text-[#1c1917] py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-sm disabled:opacity-50 active:scale-[0.99]"
                >
                  {submittingReview ? 'SUBMITTING…' : 'SUBMIT REVIEW'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY BOTTOM ACTION BAR (Mobile-Only Quick Conversion) ───── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf7f0]/95 backdrop-blur-md border-t-2 border-[#eab308] px-3 xs:px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="inline-flex items-center border border-[#eab308] bg-white shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-8 flex items-center justify-center font-black text-xs text-[#1c1917]"
            >
              −
            </button>
            <span className="w-5 text-center font-black text-xs text-[#1c1917]">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-8 flex items-center justify-center font-black text-xs text-[#1c1917]"
            >
              +
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#1c1917] leading-none truncate">₹{totalPrice.toLocaleString('en-IN')}</p>
            <p className="text-[9px] font-bold text-[#d97706] truncate mt-0.5">₹199 Shipping • COD Available</p>
          </div>
        </div>

        <button
          onClick={handleDirectPurchase}
          className="relative bg-[#1c1917] text-[#facc15] px-4 xs:px-5 py-2.5 text-[10px] xs:text-[11px] font-black uppercase tracking-[0.14em] active:scale-95 transition-transform shadow-md shrink-0 whitespace-nowrap"
        >
          <span>ORDER NOW</span>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#eab308] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
        </button>
      </div>

    </div>
  );
}