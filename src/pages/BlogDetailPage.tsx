import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Tag, Share2, Check,
  ChevronDown, ShoppingBag, Sparkles, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  category: string;
  excerpt?: string;
  content: string;
  reading_time: number;
  image_url?: string;
  image_alt?: string;
  tags: string[];
  author: string;
  faq_schema?: Array<{ question: string; answer: string }>;
  views: number;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Kitchen Tips':       'bg-amber-100 text-amber-800 border-amber-200',
  'Buying Guide':       'bg-blue-100 text-blue-800 border-blue-200',
  'Recipes':            'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Product Spotlight':  'bg-purple-100 text-purple-800 border-purple-200',
  'Health & Wellness':  'bg-rose-100 text-rose-800 border-rose-200',
  'Maintenance':        'bg-orange-100 text-orange-800 border-orange-200',
};

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [related, setRelated] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    apiClient.get(`/blogs/${slug}`)
      .then((res: any) => {
        if (res?.data?.blog) {
          setBlog(res.data.blog);
          setRelated(res.data.related || []);
          document.title = `${res.data.blog.title} — Waves & Wires`;
        } else {
          setBlog(null);
        }
      })
      .catch(() => {
        setBlog(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
        <p className="text-stone-500 text-sm font-medium">Loading article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-2">Article Not Found</h1>
        <p className="text-stone-500 text-sm mb-6">The article you are looking for does not exist or may have been moved.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-black transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(blog.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="min-h-screen bg-[#faf8f5] text-stone-900 py-8 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Articles</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold shadow-2xs transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Category & Metadata header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 flex-wrap mb-4">
            <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${CATEGORY_COLORS[blog.category] || 'bg-amber-100 text-amber-800 border-amber-200'}`}>
              {blog.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-500 font-medium">
              <Calendar className="h-3.5 w-3.5" /> {formattedDate}
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1 text-xs text-stone-500 font-medium">
              <Clock className="h-3.5 w-3.5" /> {blog.reading_time || 3} min read
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-stone-950 tracking-tight leading-[1.18] mb-4">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              {blog.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-stone-200/80 mt-6">
            <div className="h-11 w-11 rounded-2xl bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/logo.png" alt="Waves & Wires" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <span>{blog.author || 'Waves & Wires Editorial'}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Verified Brand
                </span>
              </p>
              <p className="text-[11px] text-stone-500">Official Kitchen Appliance &amp; Culinary Research Team</p>
            </div>
          </div>
        </div>

        {/* Featured Image with Waves & Wires Verified Brand Watermark */}
        {blog.image_url && (
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-10 shadow-lg shadow-amber-900/5 border border-stone-200/80 bg-stone-100 group">
            <img
              src={blog.image_url}
              alt={blog.image_alt || blog.title}
              className="w-full h-auto max-h-[520px] object-cover"
              loading="eager"
            />
            {/* Waves & Wires Verified Logo Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-md">
              <img src="/logo.png" alt="Waves & Wires" className="h-4 w-auto object-contain" />
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-900">Waves &amp; Wires Official</span>
            </div>
          </div>
        )}

        {/* Main Article Body */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm border border-stone-200/70 mb-10">
          <div
            className="article-rich-content prose prose-stone prose-headings:font-black prose-headings:tracking-tight prose-headings:text-stone-950 prose-p:text-stone-700 prose-p:leading-relaxed prose-a:text-amber-600 prose-a:underline hover:prose-a:text-amber-700 prose-li:text-stone-700 prose-strong:text-stone-900 max-w-none text-base sm:text-lg"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="pt-8 mt-10 border-t border-stone-100 flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-stone-400 shrink-0" />
              {blog.tags.map((t, idx) => (
                <span key={idx} className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-lg font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Schema Accordion */}
        {blog.faq_schema && blog.faq_schema.length > 0 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-stone-200/70 mb-10 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-8 w-8 rounded-xl bg-amber-400/20 text-amber-700 flex items-center justify-center font-bold">
                ?
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-stone-950">Frequently Asked Questions</h3>
                <p className="text-xs text-stone-500">Quick answers to common questions about this topic</p>
              </div>
            </div>

            <div className="space-y-3">
              {blog.faq_schema.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="rounded-xl border border-stone-200 overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 font-bold text-stone-900 text-sm flex items-center justify-between gap-4 bg-stone-50/50 hover:bg-stone-50 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 py-4 text-xs sm:text-sm text-stone-600 bg-white border-t border-stone-100 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Conversion CTA Banner */}
        <div className="rounded-2xl sm:rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#1c1917] text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Flagship Kitchen Innovation
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Electric Coconut Scraper Model M01
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                Shred fresh coconut into fluffy flakes in under 90 seconds. 150W pure copper motor, food-grade SS 304 blades, vacuum lock base, and 1-Year Replacement Warranty.
              </p>
              <div className="flex items-center gap-4 text-xs text-amber-400 font-bold pt-1 justify-center md:justify-start">
                <span>✓ ₹199 Express Shipping</span>
                <span>•</span>
                <span>✓ Cash on Delivery (COD)</span>
                <span>•</span>
                <span>✓ 100% Genuine</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
              <div className="text-center">
                <span className="text-xs text-stone-400 line-through mr-2">₹4,999</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">₹2,300</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">+ 18% GST (₹2,714)</span>
              </div>
              <Link
                to="/checkout"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-sm tracking-wide uppercase hover:shadow-lg hover:shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Order Now</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-950 mb-6">More from Waves & Wires</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item._id}
                  to={`/blog/${item.slug}`}
                  className="group rounded-2xl bg-white border border-stone-200 overflow-hidden hover:shadow-md hover:border-amber-300 transition-all flex flex-col"
                >
                  <div className="aspect-video bg-stone-100 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-bold">
                        W&W
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-black text-stone-900 group-hover:text-amber-600 transition-colors line-clamp-2 mt-1">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-3 font-medium">
                      {item.reading_time || 3} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
}
