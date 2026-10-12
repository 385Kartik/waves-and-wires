import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const [sortBy, setSortBy] = useState('newest');
  const [priceMax, setPriceMax] = useState(50000);
  const [showFilters, setShowFilters] = useState(false);

  const { products: raw, loading } = useProducts({
    categorySlug: categoryFilter || undefined,
    search: searchQuery || undefined,
  });
  const { categories } = useCategories();

  const products = useMemo(() => {
    let result = [...raw].filter(p => (p.price || 0) <= priceMax);
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return result;
  }, [raw, sortBy, priceMax]);

  function setCategory(slug: string) {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set('category', slug);
    else p.delete('category');
    setSearchParams(p);
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name ?? 'Products' : searchQuery ? `"${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{loading ? '…' : `${products.length} products`}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="rounded-xl border border-input bg-secondary px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-input bg-secondary px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold hover:bg-accent transition-colors lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-60 shrink-0 space-y-6`}>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    !categoryFilter ? 'bg-primary/15 text-primary font-bold' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                      categoryFilter === cat.slug ? 'bg-primary/15 text-primary font-bold' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Max Price</h3>
              <input
                type="range"
                min={500}
                max={50000}
                step={500}
                value={priceMax}
                onChange={e => setPriceMax(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-sm font-semibold text-foreground mt-1">Up to ₹{priceMax.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
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
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-2xl border border-border bg-card p-8">
              <p className="text-lg font-bold text-foreground">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              <button
                onClick={() => { setCategory(''); setPriceMax(50000); }}
                className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
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
