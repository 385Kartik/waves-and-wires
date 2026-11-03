import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1, openDrawer = true) => {
    if (!user) {
      toast.info('Please sign in or create an account to add items to your cart.');
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
      return;
    }

    // Capture CRM lead for Add to Cart
    apiClient.post('/leads', {
      name: user.full_name || 'Customer',
      phone: user.phone || '',
      email: user.email?.endsWith('@ww.internal') ? '' : user.email,
      source: 'add_to_cart',
      quantity: quantity,
      product_name: product.name || 'Electric Coconut Scraper',
      status: 'new_lead',
      notes: `Added ${quantity} unit(s) of ${product.name} to cart`,
      user_id: user.id,
    }).catch((err) => console.warn('[CRM Lead Cart Error]', err));

    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = openDrawer ? existing.quantity + quantity : quantity;
        // Cap at stock
        const capped = Math.min(newQty, product.stock);
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: capped } : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
    if (openDrawer) setIsOpen(true);
  }, [user]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }  // Cap at stock
          : item
      )
    );

    if (user?.phone) {
      apiClient.post('/leads', {
        name: user.full_name || 'Customer',
        phone: user.phone,
        email: user.email?.endsWith('@ww.internal') ? '' : user.email,
        source: 'add_to_cart',
        quantity: quantity,
        product_name: 'Electric Coconut Scraper',
        status: 'new_lead',
        notes: `Cart quantity updated to ${quantity} unit(s)`,
        user_id: user.id,
      }).catch(() => {});
    }
  }, [user]);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal  = items.reduce((sum, item) => {
    const lineTotal = item.product.price * item.quantity;
    const comboOff  = item.product.id === 'm01-headset' && item.quantity >= 2 ? 200 : 0;
    return sum + lineTotal - comboOff;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
