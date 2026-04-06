import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Headphones, Star, Zap, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';

// ── Hero product mosaic images (replace with your actual product images) ──────
const HERO_IMAGES = [
  '/products/hero-1.jpg',
  '/products/hero-2.jpg',
  '/products/hero-3.jpg',
  '/products/hero-4.jpg',
];

export default function HomePage() {
  const { products: featured, loading: pLoading } = useProducts({ limit: 8 });
  const { categories, loading: cLoading }         = useCategories();

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative bg-black overflow-hidden min-h-[88vh] flex items-center">

        {/* Background grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

        {/* Glow blob */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-yellow-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[400px] w-[400px] rounded-full bg-yellow-400/5 blur-[100px]" />

        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 py-16 lg:py-0 items-center">

          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 tracking-widest uppercase">New Arrivals — Up to 40% Off</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">
                Premium
                <span className="block text-yellow-400">Tech for</span>
                <span className="block text-white">Modern Life.</span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
                Curated electronics & kitchen appliances. Quality you can trust, prices that make sense.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/shop"
                className="group inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 text-sm font-black text-black hover:bg-yellow-300 transition-all duration-200 shadow-lg shadow-yellow-400/20">
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/shop"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
                Browse Categories
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['#f5c018','#e0d0a0','#c8b060','#d4be80'].map((c, i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black"
                    style={{ background: c, color: '#000', zIndex: 4 - i }}>
                    {['A','S','A','P'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                  <span className="ml-1 text-sm font-bold text-white">4.9</span>
                </div>
                <p className="text-xs text-zinc-500">2,400+ happy customers</p>
              </div>
            </div>
          </div>

          {/* Right: Product Mosaic */}
          <div className="relative hidden lg:grid grid-cols-2 gap-3 h-[520px]">
            {/* Large left card */}
            <div className="row-span-2 rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 relative group">
              <img src={HERO_IMAGES[0]} alt="Product" className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black text-black uppercase tracking-wider">Best Seller</span>
              </div>
            </div>
            {/* Top right */}
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 relative group">
              <img src={HERO_IMAGES[1]} alt="Product" className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            {/* Bottom right: two mini */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 relative group">
                <img src={HERO_IMAGES[2]} alt="Product" className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="rounded-3xl overflow-hidden border border-yellow-400/30 bg-yellow-400/5 flex flex-col items-center justify-center gap-2 text-center p-4">
                <Package className="h-8 w-8 text-yellow-400" />
                <p className="text-[11px] font-black text-yellow-400 leading-tight">500+<br/>Products</p>
              </div>
            </div>
          </div>

          {/* Mobile: single image */}
          <div className="lg:hidden rounded-3xl overflow-hidden border border-white/10 h-60">
            <img src={HERO_IMAGES[0]} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── TRUST BADGES ──────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-5">
          <div className="grid grid-cols-3 gap-4 md:grid-cols-3">
            {[
              { icon: Truck,       title: 'Free Shipping',   desc: 'On orders above ₹999' },
              { icon: ShieldCheck, title: 'Secure Payments', desc: 'PhonePe & COD both' },
              { icon: Headphones,  title: '24/7 Support',    desc: 'Mon–Sat, 9AM–7PM' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 py-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      {!cLoading && categories.length > 0 && (
        <section className="container py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Collections</p>
              <h2 className="text-3xl font-black text-foreground">Shop by Category</h2>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat, i) => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                <div className={`overflow-hidden bg-secondary ${i === 0 ? 'aspect-[4/3] sm:aspect-square' : 'aspect-[4/3]'}`}>
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="h-full w-full flex items-center justify-center text-muted-foreground/20 text-5xl font-black">{cat.name[0]}</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={`font-black text-white drop-shadow ${i === 0 ? 'text-xl' : 'text-sm'}`}>{cat.name}</p>
                  {cat.description && i === 0 && (
                    <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{cat.description}</p>
                  )}
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop Now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <section className="container pb-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Handpicked</p>
            <h2 className="text-3xl font-black text-foreground">Featured Products</h2>
          </div>
          <Link to="/shop" className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-bold text-foreground hover:bg-accent transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {pLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 space-y-3">
                  <div className="h-3.5 rounded-full bg-secondary w-3/4" />
                  <div className="h-3 rounded-full bg-secondary w-1/2" />
                  <div className="h-5 rounded-full bg-secondary w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(featured.filter(p => p.is_featured).length > 0
              ? featured.filter(p => p.is_featured)
              : featured
            ).slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── BOTTOM CTA STRIP ──────────────────────────────────────────────── */}
      <section className="bg-primary py-14">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-black">Ready to upgrade your setup?</h3>
            <p className="mt-1 text-sm font-medium text-black/70">Free shipping on orders above ₹999. COD available.</p>
          </div>
          <Link to="/shop"
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-8 py-4 text-sm font-black text-yellow-400 hover:bg-zinc-900 transition-all shrink-0 shadow-lg">
            Browse All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}