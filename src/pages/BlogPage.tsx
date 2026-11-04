import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Calendar, Clock, Search, Sparkles, Tag } from 'lucide-react';
import { apiClient } from '@/api/client';

interface BlogPost {
  _id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  category: string;
  reading_time?: number;
  image_url?: string;
  image_alt?: string;
  created_at?: string;
}

const STATIC_FALLBACK_POSTS: BlogPost[] = [
  {
    slug: 'electric-coconut-scraper-benefits',
    title: 'Why Every Indian Kitchen Needs an Electric Coconut Scraper',
    excerpt: 'Scraping coconut by hand is time-consuming and tiring. Discover how our electric coconut scraper transforms this daily kitchen task into a quick, effortless process.',
    category: 'Kitchen Tips',
    reading_time: 4,
    image_url: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1200&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    slug: 'coconut-scraper-buying-guide',
    title: 'Buying Guide: What to Look for in an Electric Coconut Scraper',
    excerpt: 'Motor power, blade type, safety features — we break down everything you need to know before buying an electric coconut scraper in India.',
    category: 'Buying Guide',
    reading_time: 5,
    image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    slug: 'coconut-recipes-india',
    title: '10 Popular Indian Recipes That Use Freshly Scraped Coconut',
    excerpt: 'From Kerala fish curry to Goan prawn masala — freshly scraped coconut makes all the difference. Here are 10 recipes where fresh coconut is the star.',
    category: 'Recipes',
    reading_time: 6,
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1200&auto=format&fit=crop',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    slug: 'hot-water-bag-benefits',
    title: 'Hot Water Bags: A Natural Remedy for Pain Relief & Muscle Relaxation',
    excerpt: 'Electric hot water bags are safer, more convenient, and more effective than traditional rubber bags. Here is why doctors recommend heat therapy for muscle pain.',
    category: 'Health & Wellness',
    reading_time: 4,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    slug: 'kitchen-appliances-maintenance',
    title: 'How to Clean and Maintain Your Electric Kitchen Appliances',
    excerpt: 'Proper maintenance extends the life of your appliances and keeps them hygienic. Follow these simple tips to keep your Waves & Wires products in top condition.',
    category: 'Maintenance',
    reading_time: 3,
    image_url: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?q=80&w=1200&auto=format&fit=crop',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const CATEGORIES = [
  'All',
  'Kitchen Tips',
  'Buying Guide',
  'Recipes',
  'Product Spotlight',
  'Health & Wellness',
  'Maintenance',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Kitchen Tips':       'bg-amber-100 text-amber-800',
  'Buying Guide':       'bg-blue-100 text-blue-800',
  'Recipes':            'bg-emerald-100 text-emerald-800',
  'Product Spotlight':  'bg-purple-100 text-purple-800',
  'Health & Wellness':  'bg-rose-100 text-rose-800',
  'Maintenance':        'bg-orange-100 text-orange-800',
};

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 30 };
    if (activeCategory !== 'All') params.category = activeCategory;
    if (search.trim()) params.search = search.trim();

    apiClient.get('/blogs', { params })
      .then((res: any) => {
        if (res?.data?.blogs && res.data.blogs.length > 0) {
          setBlogs(res.data.blogs);
        } else {
          // If no search/filter match or DB empty, fallback
          const filtered = STATIC_FALLBACK_POSTS.filter((p) => {
            const matchesCat = activeCategory === 'All' || p.category === activeCategory;
            const matchesSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
            return matchesCat && matchesSearch;
          });
          setBlogs(filtered);
        }
      })
      .catch(() => {
        const filtered = STATIC_FALLBACK_POSTS.filter((p) => {
          const matchesCat = activeCategory === 'All' || p.category === activeCategory;
          const matchesSearch = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase());
          return matchesCat && matchesSearch;
        });
        setBlogs(filtered);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const featured = blogs[0];
  const remaining = blogs.slice(1);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-10 lg:px-14 py-10 sm:py-14">
      
      {/* Header */}
      <div className="mb-10 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
                <BookOpen className="h-5 w-5 text-stone-950" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-stone-950 tracking-tight">Waves & Wires Blog</h1>
            </div>
            <p className="text-stone-600 text-sm sm:text-base">
              Smart kitchen guides, culinary recipes, appliance maintenance & healthy living tips.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search recipes, tips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center py-16">
          <div className="h-10 w-10 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
          <p className="text-stone-500 text-sm font-medium">Fetching articles...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8">
          <BookOpen className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900 mb-1">No articles found</h3>
          <p className="text-xs text-stone-500">Try adjusting your search query or selecting a different category.</p>
        </div>
      ) : (
        <>
          {/* Featured Hero Article */}
          {featured && (
            <Link
              to={`/blog/${featured.slug}`}
              className="block rounded-3xl border border-stone-200 bg-white overflow-hidden mb-12 hover:shadow-xl hover:border-amber-400 transition-all duration-300 group shadow-sm"
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-[16/10] md:aspect-auto overflow-hidden bg-stone-100 relative">
                  {featured.image_url ? (
                    <img
                      src={featured.image_url}
                      alt={featured.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full min-h-[260px] flex items-center justify-center bg-amber-50">
                      <BookOpen className="h-16 w-16 text-amber-300" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-stone-950/90 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3 w-3" /> Featured Article
                  </div>
                </div>

                <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${CATEGORY_COLORS[featured.category] || 'bg-amber-100 text-amber-800'}`}>
                        {featured.category}
                      </span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-500 font-medium">
                        {featured.reading_time || 4} min read
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-950 leading-tight group-hover:text-amber-600 transition-colors">
                      {featured.title}
                    </h2>

                    <p className="text-stone-600 text-sm sm:text-base leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      <span>
                        {featured.created_at
                          ? new Date(featured.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recently'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 group-hover:translate-x-1 transition-transform">
                      Read Full Guide <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid of Remaining Articles */}
          {remaining.length > 0 && (
            <div>
              <h3 className="text-xl font-black text-stone-950 mb-6 tracking-tight">Recent Articles</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {remaining.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group rounded-3xl bg-white border border-stone-200 overflow-hidden hover:shadow-lg hover:border-amber-300 transition-all duration-300 flex flex-col shadow-2xs"
                  >
                    <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-50/50 text-amber-300 text-xs font-bold">
                          Waves & Wires
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs ${CATEGORY_COLORS[post.category] || 'bg-white text-stone-800'}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-stone-950 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-2 mt-2 font-normal">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs text-stone-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {post.reading_time || 3} min
                        </span>
                        <span className="text-amber-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Read <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
