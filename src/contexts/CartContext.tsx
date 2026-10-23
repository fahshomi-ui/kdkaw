import React, { createContext, useContext, useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'makani_cart_v1';
const COUPON_STORAGE_KEY = 'makani_coupon_v1';
import { DbProduct } from '@/hooks/useStore';
import { getPrepFeesForItem } from '@/lib/preparations';
import { getCartPricing, getDeliveryFee, PRODUCT_DISCOUNT_PERCENT } from '@/lib/pricing';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface CartItem {
  product: DbProduct;
  quantity: number;
  preparations?: string[];
}


interface CartContextType {
  items: CartItem[];
  addItem: (product: DbProduct, quantity?: number, preparations?: string[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  preparationFees: number;
  discount: number;
  discountPercent: number;
  couponCode: string;
  deliveryFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  // A product promotion, not a removable coupon or browser-stored percentage.
  const couponCode = '';
  const discountPercent = PRODUCT_DISCOUNT_PERCENT;

  useEffect(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  useEffect(() => {
    try { localStorage.removeItem(COUPON_STORAGE_KEY); } catch {}
  }, []);

  const addItem = (product: DbProduct, quantity = 1, preparations?: string[]) => {
    if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
      toast.error(lang === 'ar' ? 'سعر هذا المنتج غير متوفر بعد' : 'This product price is not available yet');
      return;
    }
    setItems(prev => {
      const prepKey = (preparations || []).sort().join(',');
      const existing = prev.find(i => i.product.id === product.id && (i.preparations || []).sort().join(',') === prepKey);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { product, quantity, preparations }];
    });
  };

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.product.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => { setItems([]); };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const preparationFees = items.reduce((sum, i) => sum + getPrepFeesForItem(i.preparations, i.quantity), 0);
  const deliveryFee = getDeliveryFee();
  const { subtotal, discount, total } = getCartPricing(items, preparationFees);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, preparationFees, discount, discountPercent, couponCode, deliveryFee, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
