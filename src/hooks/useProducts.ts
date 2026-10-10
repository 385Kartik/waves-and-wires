import { useState, useEffect } from 'react';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { orderService } from '@/services/order.service';
import { Product, Category } from '@/types';
import { products as fallbackProducts, categories as fallbackCategories } from '@/data/products';

function normalizeProduct(p: any): Product {
  const catName = p.category_name ||
    (typeof p.category_id === 'object' && p.category_id ? p.category_id.name : '') ||
    p.category ||
    'Electronics';

  const imgs = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.image ? [p.image] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop']);

  return {
    id: String(p.id || p._id || Math.random()),
    name: p.name || 'Product',
    slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product'),
    description: p.description || '',
    short_description: p.short_description || '',
    price: Number(p.price) || 999,
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : undefined,
    images: imgs,
    category_id: typeof p.category_id === 'object' && p.category_id ? String(p.category_id._id || p.category_id.id) : String(p.category_id || ''),
    category_name: String(catName),
    stock: p.stock !== undefined ? Number(p.stock) : 50,
    sku: p.sku || 'WW-SKU',
    features: Array.isArray(p.features) ? p.features : [],
    specifications: typeof p.specifications === 'object' && p.specifications ? p.specifications : {},
    rating: Number(p.rating) || 4.5,
    review_count: Number(p.review_count) || 120,
    is_featured: Boolean(p.is_featured),
    created_at: p.created_at || new Date().toISOString(),
  };
}

// ── Products ──────────────────────────────────────────────────
export function useProducts(opts?: { categorySlug?: string; search?: string; limit?: number }) {
  const [products, setProducts] = useState<Product[]>(() => fallbackProducts.map(normalizeProduct));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res: any = await productService.getProducts({
          categorySlug: opts?.categorySlug,
          search: opts?.search,
          limit: opts?.limit,
          populate: true,
        });
        const apiData = Array.isArray(res?.data) ? res.data : [];
        if (apiData.length > 0) {
          setProducts(apiData.map(normalizeProduct));
        } else {
          // Filter fallback data safely
          let filtered = fallbackProducts.map(normalizeProduct);
          if (opts?.categorySlug) {
            const slug = opts.categorySlug.toLowerCase();
            filtered = filtered.filter(p =>
              (p.category_name || '').toLowerCase().includes(slug) ||
              (p.category_id || '').toLowerCase().includes(slug)
            );
          }
          if (opts?.search) {
            const q = opts.search.toLowerCase();
            filtered = filtered.filter(p =>
              (p.name || '').toLowerCase().includes(q) ||
              (p.description || '').toLowerCase().includes(q) ||
              (p.category_name || '').toLowerCase().includes(q)
            );
          }
          if (opts?.limit) {
            filtered = filtered.slice(0, opts.limit);
          }
          setProducts(filtered);
        }
      } catch {
        // Fallback filter
        let filtered = fallbackProducts.map(normalizeProduct);
        if (opts?.categorySlug) {
          const slug = opts.categorySlug.toLowerCase();
          filtered = filtered.filter(p =>
            (p.category_name || '').toLowerCase().includes(slug) ||
            (p.category_id || '').toLowerCase().includes(slug)
          );
        }
        if (opts?.search) {
          const q = opts.search.toLowerCase();
          filtered = filtered.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (p.category_name || '').toLowerCase().includes(q)
          );
        }
        if (opts?.limit) {
          filtered = filtered.slice(0, opts.limit);
        }
        setProducts(filtered);
      }
      setLoading(false);
    }
    load();
  }, [opts?.categorySlug, opts?.search, opts?.limit]);

  return { products, loading };
}

// ── Single product ────────────────────────────────────────────
export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(() => {
    const found = fallbackProducts.find(p => p.slug === slug || p.id === slug);
    return found ? normalizeProduct(found) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    productService.getProductBySlug(slug)
      .then((res: any) => {
        if (res?.data) {
          setProduct(normalizeProduct(res.data));
        } else {
          const found = fallbackProducts.find(p => p.slug === slug || p.id === slug) || null;
          setProduct(found ? normalizeProduct(found) : null);
        }
        setLoading(false);
      })
      .catch(() => {
        const found = fallbackProducts.find(p => p.slug === slug || p.id === slug) || null;
        setProduct(found ? normalizeProduct(found) : null);
        setLoading(false);
      });
  }, [slug]);

  return { product, loading };
}

// ── Categories ────────────────────────────────────────────────
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getCategories()
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        if (list.length > 0) {
          setCategories(list.map((c: any) => ({
            id: String(c.id || c._id),
            name: c.name || 'Category',
            slug: c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'category'),
            description: c.description || '',
            image: c.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
            product_count: c.product_count || 5,
          })));
        } else {
          setCategories(fallbackCategories);
        }
        setLoading(false);
      })
      .catch(() => {
        setCategories(fallbackCategories);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}

// ── User orders ───────────────────────────────────────────────
export function useMyOrders(userId?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    if (!userId) { setLoading(false); return; }
    orderService.getOrders()
      .then((res: any) => {
        setOrders(Array.isArray(res?.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  return { orders, loading, refetch: fetchOrders };
}
