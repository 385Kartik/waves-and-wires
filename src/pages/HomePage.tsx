import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Headphones, Star } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';

export default function HomePage() {
  const { products: featured, loading: pLoading } = useProducts({ limit: 8 });
  const { categories, loading: cLoading } = useCategories();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-secondary to-background">
        <div className="container flex flex-col items-center gap-6 py-20 text-center lg:py-28">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            🚀 New Arrivals — Up to 40% Off
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Premium Tech for
            <span className="text-primary"> Modern Living</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Discover cutting-edge electronics and kitchen appliances. Quality you can trust, prices you'll love.
          </p>
          <div className="flex gap-3">
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-8 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-secondary/50">
        <div className="container grid grid-cols-3 gap-8 py-8">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
            { icon: Shield, title: 'Secure Payments', desc: 'Razorpay protected' },
            { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {!cLoading && categories.length > 0 && (
        <section className="container py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Shop by Category</h2>
              <p className="mt-1 text-sm text-muted-foreground">Find exactly what you need</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map(cat => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200">
                <div className="aspect-video overflow-hidden bg-secondary">
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-4xl font-bold">{cat.name[0]}</div>
                  }
                </div>
                <div className="p-3">
                  <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
            <p className="mt-1 text-sm text-muted-foreground">Our best picks for you</p>
          </div>
          <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {pLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded bg-secondary" />
                  <div className="h-3 rounded bg-secondary w-2/3" />
                  <div className="h-5 rounded bg-secondary w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.filter(p => p.is_featured).slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {featured.filter(p => p.is_featured).length === 0 && featured.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
