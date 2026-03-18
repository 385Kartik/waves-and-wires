import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';

// ── Products ──────────────────────────────────────────────────
export function useProducts(opts?: { categorySlug?: string; search?: string; limit?: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (opts?.search) q = q.ilike('name', `%${opts.search}%`);
      if (opts?.limit) q = q.limit(opts.limit);

      if (opts?.categorySlug) {
        const { data: cat } = await supabase
          .from('categories').select('id').eq('slug', opts.categorySlug).single();
        if (cat) q = q.eq('category_id', cat.id);
      }

      const { data } = await q;
      setProducts((data ?? []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name ?? '',
      })));
      setLoading(false);
    }
    load();
  }, [opts?.categorySlug, opts?.search, opts?.limit]);

  return { products, loading };
}

// ── Single product ────────────────────────────────────────────
export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        setProduct(data ? { ...data, category_name: data.categories?.name ?? '' } : null);
        setLoading(false);
      });
  }, [slug]);

  return { product, loading };
}

// ── Categories ────────────────────────────────────────────────
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setCategories(data ?? []);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}

// ── User orders ───────────────────────────────────────────────
export function useMyOrders(userId?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [userId]);

  return { orders, loading, refetch: () => {} };
}
