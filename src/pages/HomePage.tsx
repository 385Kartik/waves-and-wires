import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Truck, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const M01_PRODUCT = {
  id: 'prod-5',
  name: 'Waves & Wires Electric Coconut Scraper Model M01',
  slug: 'electric-coconut-scraper-pro',
  price: 2550,
  compare_at_price: 3499,
  images: [
    '/product/scraper-angle-clean.png',
    '/product/scraper-action-clean.png',
    '/product/scraper-cap-clean.png',
  ],
  category_id: 'cat-2',
  category_name: 'Kitchen & Appliances',
  stock: 50,
  sku: 'WW-CS-001',
  description: 'Electric Coconut Scraper Pro Ultra with Vacuum Base & Steel Blade',
  rating: 5.0,
  review_count: 30,
};

export default function HomePage() {
  const { addItem, setIsOpen } = useCart();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);

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

  return (
    <div className="w-full overflow-x-hidden bg-[#faf6ed] text-[#1c1917] selection:bg-[#facc15] selection:text-black font-sans antialiased">

      {/* ── 1. HERO SECTION (Mobile-First + Desktop Luxury Layout) ──────────── */}
      <section id="overview" className="relative w-full min-h-[auto] lg:min-h-[90vh] flex items-center px-4 sm:px-10 md:px-14 lg:px-20 py-6 sm:py-12 lg:py-10 border-b border-amber-900/10 bg-gradient-to-br from-[#fdfcf8] via-[#faf5ea] to-[#f4ecd8]">
        
        {/* Subtle diagonal warm lighting facets */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(135deg,rgba(255,255,255,0.8)_0%,transparent_50%,rgba(234,179,8,0.06)_100%)]" />

        <div className="w-full max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center relative z-10">

          {/* Left Column: Script Brand + Gigantic M01 + Bright Gold Split Box Button */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 pt-1 lg:pt-0 order-2 lg:order-1">
            
            {/* Brand Wordmark in Cormorant Garamond Serif Italic Bright Gold Yellow */}
            <div className="space-y-0">
              <h3 className="font-serif italic text-2xl xs:text-3xl sm:text-5xl lg:text-6xl text-[#d97706] font-normal tracking-normal leading-tight">
                Waves <span className="font-serif italic text-[#eab308]">Wires</span>
              </h3>
              
              {/* Massive Bold M01 Title */}
              <h1 className="text-6xl xs:text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-black text-[#1c1917] tracking-tighter leading-[0.88] select-none my-1">
                M01
              </h1>
              
              {/* Subtitle with Bright Gold Accent Rules */}
              <div className="flex items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                <span className="h-[1.5px] w-5 sm:w-8 bg-[#eab308] shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.28em] text-[#8c6b32]">
                  ELECTRIC COCONUT SCRAPER
                </span>
                <span className="h-[1.5px] w-8 sm:w-14 bg-[#eab308] hidden xs:block shrink-0" />
              </div>
            </div>

            {/* Editorial Paragraph */}
            <p className="text-xs sm:text-base text-[#4a4237] max-w-xl font-light leading-relaxed pt-0.5">
              Upgrade your kitchen with the ultimate coconut convenience. A high-torque 150W pure copper motor and food-grade SS 304 dual cutter that shreds fresh coconut in 60 seconds with zero manual strain.
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

              {/* Free Delivery & COD Highlight */}
              <p className="text-[11px] font-bold text-[#8c6b32] flex items-center gap-2 pt-0.5">
                <Truck className="h-3.5 w-3.5 text-[#d97706] shrink-0" />
                <span>Free 2-Day Express Delivery • Cash on Delivery (COD) Available</span>
              </p>

            </div>

          </div>

          {/* Right Column: Hero Transparent Product Cutout with Golden Glow & Studio Shadow */}
          <div className="lg:col-span-5 flex justify-center items-center relative py-1 sm:py-6 order-1 lg:order-2">
            <div className="relative w-full max-w-[220px] xs:max-w-[260px] sm:max-w-md lg:max-w-xl aspect-square flex items-center justify-center">
              
              {/* Warm Golden studio backlight */}
              <div className="absolute inset-0 bg-radial from-yellow-300/35 via-amber-200/15 to-transparent rounded-full filter blur-3xl pointer-events-none" />
              
              <img
                src="/product/scraper-angle-clean.png"
                alt="Waves & Wires M01 Electric Coconut Scraper"
                className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_22px_32px_rgba(0,0,0,0.22)] transform hover:scale-105 hover:-rotate-1 transition-all duration-700 ease-out"
              />

              {/* Ground contact shadow */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-6 sm:h-8 bg-black/15 filter blur-xl rounded-[100%] pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Far Right Vertical Indicator (Bright Gold Diamond + Warm Yellow Dots) */}
        <div className="hidden xl:flex flex-col items-center gap-3 absolute right-8 top-1/2 -translate-y-1/2 z-20">
          <div className="w-2.5 h-2.5 border-2 border-[#eab308] rotate-45 bg-[#facc15]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]/40" />
        </div>

      </section>

      {/* ── 2. DARK STATEMENT BAND: DESIGN & QUALITY ──────────────────────────── */}
      <section id="design" className="w-full bg-[#181613] text-white py-12 sm:py-20 px-4 sm:px-10 text-center border-y border-amber-950/40">
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-[#facc15]">
            DESIGN & QUALITY
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-[#f5efe6] font-light leading-relaxed max-w-2xl mx-auto">
            Waves & Wires Model M01 coconut scraper has been developed for modern kitchens, the main focus has been on creating a high-torque pure copper motor with surgical SS 304 food-grade rotary cutters.
          </p>
          <div className="pt-1 sm:pt-2 text-[#eab308] text-xs select-none">
            ×
          </div>
        </div>
      </section>

      {/* ── 3. ASYMMETRIC CRAFTSMANSHIP (Left 3 Specs | Center Machine | Right Story) ── */}
      <section className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-12 sm:py-20 lg:py-24 bg-[#f6f0e2] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center">

            {/* Left Column: 3 Circular Specs with Bright Gold Accents & Dotted Dividers */}
            <div className="lg:col-span-4 space-y-5 sm:space-y-8">
              
              {/* Spec 1 */}
              <div className="flex items-center gap-4 sm:gap-5">
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
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#eab308] bg-yellow-400/20 flex items-center justify-center shrink-0 text-[#d97706] shadow-sm shadow-yellow-500/10">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base sm:text-lg font-black text-[#1c1917] tracking-tight">
                    1 YEAR
                  </h4>
                  <p className="text-xs text-[#5c5346] font-normal">
                    Doorstep Brand Replacement Warranty
                  </p>
                </div>
              </div>

              <div className="w-full border-t border-dotted border-[#eab308]/30" />

              {/* Spec 3 */}
              <div className="flex items-center gap-4 sm:gap-5">
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

            {/* Center Column: Tall Vertical Cutout with Ground Shadow */}
            <div className="lg:col-span-4 flex justify-center items-center">
              <div className="relative w-full max-w-[230px] sm:max-w-sm aspect-square flex items-center justify-center">
                <img
                  src="/product/scraper-cap-clean.png"
                  alt="Waves & Wires Scraper with Safety Cap"
                  className="h-full w-full object-contain filter drop-shadow-[0_22px_32px_rgba(0,0,0,0.18)] transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-black/15 filter blur-lg rounded-[100%] pointer-events-none" />
              </div>
            </div>

            {/* Right Column: Editorial Craftsmanship Copy */}
            <div className="lg:col-span-4 space-y-3 sm:space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d97706] block">
                DESIGN & QUALITY
              </span>
              <p className="text-xs sm:text-sm text-[#4a4237] leading-relaxed font-light">
                Waves & Wires Model M01 coconut scraper has been developed for effortless daily cooking, the main focus has been on creating a heavy-duty product with modern ergonomics and surgical SS 304 food-grade rotary blades.
              </p>
              <p className="text-xs sm:text-sm text-[#4a4237] leading-relaxed font-light">
                The design is based on countertop stability that preserves the authentic sweetness and fluffy texture of fresh coconut in under 60 seconds. The beautiful details in yellow and charcoal bring to mind classical craftsmanship and modern kitchen efficiency at the same time.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. 3 SQUARE BRIGHT GOLD DETAIL CARDS ──────────────────────────────── */}
      <section id="details" className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-12 sm:py-20 lg:py-24 bg-[#ede4d2] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Card 1: Multi-Toothed Blade Close-Up */}
            <div className="aspect-square border-2 border-[#eab308] bg-gradient-to-br from-[#fffdfa] to-[#faf3e3] p-6 sm:p-8 lg:p-10 flex items-center justify-center overflow-hidden group shadow-md shadow-yellow-500/10 hover:shadow-xl transition-all">
              <img
                src="/product/scraper-angle-clean.png"
                alt="Multi-Toothed Rotary Blade"
                className="h-full w-full object-contain filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            </div>

            {/* Card 2: Machine In Action with Coconut */}
            <div className="aspect-square border-2 border-[#eab308] bg-gradient-to-br from-[#fffdfa] to-[#faf3e3] p-5 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden group shadow-md shadow-yellow-500/10 hover:shadow-xl transition-all">
              <img
                src="/product/scraper-action-clean.png"
                alt="In Action Coconut Shredding"
                className="h-full w-full object-contain filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            </div>

            {/* Card 3: Machine with Black Protective Dome Cap */}
            <div className="aspect-square border-2 border-[#eab308] bg-gradient-to-br from-[#fffdfa] to-[#faf3e3] p-6 sm:p-8 lg:p-10 flex items-center justify-center overflow-hidden group shadow-md shadow-yellow-500/10 hover:shadow-xl transition-all">
              <img
                src="/product/scraper-cap-clean.png"
                alt="Protective Safety Guard"
                className="h-full w-full object-contain filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            </div>

          </div>

        </div>
      </section>

      {/* ── 5. FEATURES SECTION WITH BRIGHT GOLD LEADER SPECS ────────────────── */}
      <section id="features" className="w-full px-4 sm:px-10 md:px-14 lg:px-20 py-12 sm:py-20 lg:py-24 bg-[#faf5ea] border-b border-amber-900/10">
        <div className="w-full max-w-[1700px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">

            {/* Left Column: Heading, Paragraph & Purchase Button */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
              <h2 className="text-3xl sm:text-5xl font-black text-[#1c1917] tracking-tight uppercase">
                FEATURES
              </h2>
              <p className="text-xs sm:text-sm text-[#4a4237] leading-relaxed font-light">
                Waves & Wires Model M01 integrates a 150W pure copper motor, surgical SS 304 cutters, and an instant lever-action vacuum base for rock-solid countertop stability.
              </p>

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

            {/* Center Column: Scraper Vertical Image with Warm Ambient Glow */}
            <div className="lg:col-span-4 flex justify-center items-center">
              <div className="relative w-full max-w-[230px] sm:max-w-sm aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-yellow-300/25 to-transparent rounded-full filter blur-2xl pointer-events-none" />
                <img
                  src="/product/scraper-action-clean.png"
                  alt="Scraper Features View"
                  className="h-full w-full object-contain filter drop-shadow-[0_22px_32px_rgba(0,0,0,0.2)] transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-black/15 filter blur-lg rounded-[100%] pointer-events-none" />
              </div>
            </div>

            {/* Right Column: 2x2 Grid on Mobile/Tablet, Vertical Leader Callouts on Desktop */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
              
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
                    BLADE STEEL
                  </span>
                </div>
                <p className="text-xl sm:text-3xl font-black text-[#1c1917] lg:text-right tracking-tight">
                  SS 304
                </p>
              </div>

              {/* Metric 4 */}
              <div className="space-y-1 p-3.5 lg:p-0 rounded-xl lg:rounded-none bg-white/60 lg:bg-transparent border border-amber-900/10 lg:border-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden lg:block h-[1.5px] flex-1 bg-[#eab308]/40" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#d97706]">
                    BASE MOUNT
                  </span>
                </div>
                <p className="text-lg xs:text-xl sm:text-3xl font-black text-[#1c1917] lg:text-right tracking-tight">
                  VACUUM LEVER
                </p>
              </div>

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
            <p className="text-[9px] font-bold text-[#d97706] truncate mt-0.5">Free COD + 1Yr Warranty</p>
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