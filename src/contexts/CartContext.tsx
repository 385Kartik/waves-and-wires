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

    let finalTotalQty = quantity;

    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = openDrawer ? existing.quantity + quantity : quantity;
        finalTotalQty = Math.min(newQty, product.stock);
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: finalTotalQty } : item
        );
      }
      finalTotalQty = Math.min(quantity, product.stock);
      return [...prev, { product, quantity: finalTotalQty }];
    });

    // Capture CRM lead for Add to Cart with the NEW TOTAL QUANTITY
    const phone = user.phone || localStorage.getItem('user_phone') || '';
    apiClient.post('/leads', {
      name: user.full_name || localStorage.getItem('user_name') || 'Customer',
      phone: phone,
      email: user.email?.endsWith('@ww.internal') ? '' : (user.email || ''),
      source: 'add_to_cart',
      quantity: finalTotalQty,
      product_name: product.name || 'Electric Coconut Scraper',
      status: 'new_lead',
      notes: `Cart updated to ${finalTotalQty} unit(s) of ${product.name}`,
      user_id: user.id,
    }).catch((err) => console.warn('[CRM Lead Cart Error]', err));

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

    const cappedQty = Math.max(1, Math.min(quantity, 10));

    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(cappedQty, item.product.stock) }
          : item
      )
    );

    const phone = user?.phone || localStorage.getItem('user_phone') || '';
    apiClient.post('/leads', {
      name: user?.full_name || localStorage.getItem('user_name') || 'Customer',
      phone: phone,
      email: user?.email?.endsWith('@ww.internal') ? '' : (user?.email || ''),
      source: 'add_to_cart',
      quantity: cappedQty,
      product_name: 'Electric Coconut Scraper',
      status: 'new_lead',
      notes: `Cart quantity updated to ${cappedQty} unit(s)`,
      user_id: user?.id,
    }).catch((err) => console.warn('[CRM Lead Update Qty Error]', err));
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
