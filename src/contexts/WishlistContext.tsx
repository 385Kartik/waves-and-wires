import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WishlistContextType {
  items: Product[];
  isInWishlist: (id: string) => boolean;
  toggleItem: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);

  // Load: from Supabase if logged in, else localStorage
  useEffect(() => {
    if (user) {
      supabase
        .from('wishlist')
        .select('products(*)')
        .eq('user_id', user.id)
        .then(({ data }) => {
          const products = (data ?? []).map((w: any) => w.products).filter(Boolean);
          setItems(products);
          // Also persist locally
          localStorage.setItem('wishlist', JSON.stringify(products));
        });
    } else {
      try {
        setItems(JSON.parse(localStorage.getItem('wishlist') ?? '[]'));
      } catch { setItems([]); }
    }
  }, [user?.id]);

  const isInWishlist = useCallback((id: string) => items.some(p => p.id === id), [items]);

  const toggleItem = useCallback(async (product: Product) => {
    const inList = items.some(p => p.id === product.id);
    if (inList) {
      const next = items.filter(p => p.id !== product.id);
      setItems(next);
      localStorage.setItem('wishlist', JSON.stringify(next));
      toast.success('Removed from wishlist');
      if (user) await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id);
    } else {
      const next = [...items, product];
      setItems(next);
      localStorage.setItem('wishlist', JSON.stringify(next));
      toast.success('Added to wishlist');
      if (user) await supabase.from('wishlist').upsert({ user_id: user.id, product_id: product.id }, { onConflict: 'user_id,product_id' });
    }
  }, [items, user]);

  return (
    <WishlistContext.Provider value={{ items, isInWishlist, toggleItem }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
