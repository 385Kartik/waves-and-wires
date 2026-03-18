import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const [sortBy, setSortBy] = useState('newest');
  const [priceMax, setPriceMax] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);

  const { products: raw, loading } = useProducts({ categorySlug: categoryFilter || undefined, search: searchQuery || undefined });
  const { categories } = useCategories();

  const products = useMemo(() => {
    let result = [...raw].filter(p => p.price <= priceMax);
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [raw, sortBy, priceMax]);

  function setCategory(slug: string) {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set('category', slug); else p.delete('category');
    setSearchParams(p);
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name ?? 'Products' : searchQuery ? `"${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{loading ? '…' : `${products.length} products`}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 rounded-md border border-input bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <SlidersHorizontal className="h-4 w-4" />Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-56 shrink-0 space-y-6`}>
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-1">
              <button onClick={() => setCategory('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryFilter ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}`}>
                All Products
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${categoryFilter === cat.slug ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Max Price</h3>
            <input type="range" min={0} max={20000} step={500} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))}
              className="w-full accent-primary" />
            <p className="text-sm text-muted-foreground mt-1">Up to ₹{priceMax.toLocaleString()}</p>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {[...Array(12)].map((_, i) => (
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
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <p className="text-lg font-semibold text-foreground">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              <button onClick={() => { setCategory(''); setPriceMax(10000); }}
                className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
