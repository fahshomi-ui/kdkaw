import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';

const SNAPSHOT_KEY = 'makani_cart_snapshot_v1';
const DISMISSED_KEY = 'makani_cart_recover_dismissed_v1';
const ABANDON_MS = 30 * 60 * 1000; // 30 minutes

export interface CartSnapshot {
  items: Array<{ id: string; name_ar: string; name_en: string; price: number; quantity: number; image_url?: string | null }>;
  total: number;
  savedAt: number;
}

export const useAbandonedCart = () => {
  const { items, total, clearCart, addItem } = useCart();
  const [recoverable, setRecoverable] = useState<CartSnapshot | null>(null);

  // Save snapshot whenever cart has items
  useEffect(() => {
    if (items.length > 0) {
      const snap: CartSnapshot = {
        items: items.map(i => ({
          id: i.product.id,
          name_ar: i.product.name_ar,
          name_en: i.product.name_en,
          price: Number(i.product.price),
          quantity: i.quantity,
          image_url: i.product.image_url,
        })),
        total,
        savedAt: Date.now(),
      };
      try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap)); } catch {}
    }
  }, [items, total]);

  // On mount: check if cart is empty but a recent snapshot exists (= abandoned then cleared/lost)
  useEffect(() => {
    if (items.length > 0) { setRecoverable(null); return; }
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      const dismissed = Number(localStorage.getItem(DISMISSED_KEY) || 0);
      if (!raw) return;
      const snap = JSON.parse(raw) as CartSnapshot;
      const age = Date.now() - snap.savedAt;
      if (age > ABANDON_MS && age < 7 * 24 * 60 * 60 * 1000 && snap.savedAt > dismissed && snap.items.length > 0) {
        setRecoverable(snap);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    setRecoverable(null);
  };

  const restore = async () => {
    if (!recoverable) return;
    // Re-fetch live products to keep prices accurate
    const { supabase } = await import('@/integrations/supabase/client');
    const ids = recoverable.items.map(i => i.id);
    const { data } = await supabase.from('products').select('*').in('id', ids);
    if (data) {
      data.forEach((p: any) => {
        const original = recoverable.items.find(i => i.id === p.id);
        if (original) addItem(p, original.quantity);
      });
    }
    dismiss();
  };

  return { recoverable, dismiss, restore };
};
