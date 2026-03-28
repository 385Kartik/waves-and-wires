import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Calendar, Tag } from 'lucide-react';

const posts = [
  {
    slug: 'electric-coconut-scraper-benefits',
    title: 'Why Every Indian Kitchen Needs an Electric Coconut Scraper',
    excerpt: 'Scraping coconut by hand is time-consuming and tiring. Discover how our electric coconut scraper transforms this daily kitchen task into a quick, effortless process.',
    date: 'December 15, 2024',
    category: 'Kitchen Tips',
    readTime: '4 min read',
    image: 'https://wavesandwires.in/wp-content/uploads/2024/07/CS_3-scaled-1.jpg',
  },
  {
    slug: 'coconut-scraper-buying-guide',
    title: 'Buying Guide: What to Look for in an Electric Coconut Scraper',
    excerpt: 'Motor power, blade type, safety features — we break down everything you need to know before buying an electric coconut scraper in India.',
    date: 'November 28, 2024',
    category: 'Buying Guide',
    readTime: '5 min read',
    image: 'https://wavesandwires.in/wp-content/uploads/2024/07/CS_2-scaled-1.jpg',
  },
  {
    slug: 'coconut-recipes-india',
    title: '10 Popular Indian Recipes That Use Freshly Scraped Coconut',
    excerpt: 'From Kerala fish curry to Goan prawn masala — freshly scraped coconut makes all the difference. Here are 10 recipes where fresh coconut is the star.',
    date: 'October 20, 2024',
    category: 'Recipes',
    readTime: '6 min read',
    image: 'https://wavesandwires.in/wp-content/uploads/2024/07/CS_11-text2-1.jpg',
  },
  {
    slug: 'hot-water-bag-benefits',
    title: 'Hot Water Bags: A Natural Remedy for Pain Relief',
    excerpt: 'Electric hot water bags are safer, more convenient, and more effective than traditional rubber bags. Here\'s why doctors recommend heat therapy for muscle pain.',
    date: 'September 10, 2024',
    category: 'Wellness',
    readTime: '4 min read',
    image: null,
  },
  {
    slug: 'kitchen-appliances-maintenance',
    title: 'How to Clean and Maintain Your Electric Kitchen Appliances',
    excerpt: 'Proper maintenance extends the life of your appliances and keeps them hygienic. Follow these simple tips to keep your Waves & Wires products in top condition.',
    date: 'August 5, 2024',
    category: 'Maintenance',
    readTime: '3 min read',
    image: null,
  },
];

const categoryColors: Record<string, string> = {
  'Kitchen Tips':   'bg-amber-100 text-amber-700',
  'Buying Guide':   'bg-blue-100 text-blue-700',
  'Recipes':        'bg-green-100 text-green-700',
  'Wellness':       'bg-purple-100 text-purple-700',
  'Maintenance':    'bg-orange-100 text-orange-700',
};

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <div className="container py-8 sm:py-12 max-w-5xl">
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Blog</h1>
        </div>
        <p className="text-muted-foreground text-sm">Tips, recipes, and guides from the Waves & Wires team</p>
      </div>

      {/* Featured post */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-8 hover:border-primary/30 transition-all group">
        <div className="grid sm:grid-cols-2">
          <div className="aspect-video sm:aspect-auto overflow-hidden bg-secondary">
            {featured.image
              ? <img src={featured.image} alt={featured.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="h-full min-h-[200px] flex items-center justify-center bg-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/30" />
                </div>
            }
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${categoryColors[featured.category] ?? 'bg-zinc-100 text-zinc-600'}`}>
                {featured.category}
              </span>
              <span className="text-xs text-muted-foreground">Featured</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground leading-tight">{featured.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{featured.excerpt}</p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{featured.date}</span>
                <span>{featured.readTime}</span>
              </div>
              <Link to={`/blog/${featured.slug}`}
                className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline shrink-0">
                Read More <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of posts */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {rest.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`}
            className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all group">
            {post.image && (
              <div className="aspect-video overflow-hidden bg-secondary">
                <img src={post.image} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            {!post.image && (
              <div className="h-28 bg-primary/5 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary/20" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${categoryColors[post.category] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  <Tag className="h-2.5 w-2.5 inline mr-1" />{post.category}
                </span>
              </div>
              <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">{post.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-3">
        <p className="font-bold text-foreground">Want to share something?</p>
        <p className="text-sm text-muted-foreground">Have a recipe or tip using our products? We'd love to feature it.</p>
        <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all">
          Get in Touch
        </Link>
      </div>
    </div>
  );
}