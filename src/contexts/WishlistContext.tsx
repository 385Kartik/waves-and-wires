import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product } from '@/types';
import { wishlistService } from '@/services/wishlist.service';
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

  // Load: from Service if logged in, else localStorage
  useEffect(() => {
    if (user) {
      wishlistService.getWishlist()
        .then((res) => {
          const products = res.data ?? [];
          setItems(products);
          // Also persist locally
          localStorage.setItem('wishlist', JSON.stringify(products));
        })
        .catch(() => setItems([]));
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
      if (user) {
        try { await wishlistService.remove(product.id); } catch (e) {}
      }
    } else {
      const next = [...items, product];
      setItems(next);
      localStorage.setItem('wishlist', JSON.stringify(next));
      toast.success('Added to wishlist');
      if (user) {
        try { await wishlistService.add(product.id); } catch (e) {}
      }
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
