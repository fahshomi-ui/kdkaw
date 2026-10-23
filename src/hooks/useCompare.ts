import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'makani_compare_v1';
const MAX_ITEMS = 4;

const readIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

const writeIds = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('compare-changed'));
  } catch { /* ignore */ }
};

export const useCompare = () => {
  const [ids, setIds] = useState<string[]>(() => readIds());

  useEffect(() => {
    const sync = () => setIds(readIds());
    window.addEventListener('compare-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('compare-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string, lang: 'ar' | 'en' = 'ar') => {
    const current = readIds();
    if (current.includes(id)) {
      writeIds(current.filter((x) => x !== id));
      return;
    }
    if (current.length >= MAX_ITEMS) {
      toast.error(lang === 'ar' ? `يمكنك مقارنة ${MAX_ITEMS} منتجات كحد أقصى` : `You can compare up to ${MAX_ITEMS} products`);
      return;
    }
    writeIds([...current, id]);
    toast.success(lang === 'ar' ? 'تمت إضافته للمقارنة' : 'Added to compare');
  }, []);

  const remove = useCallback((id: string) => {
    writeIds(readIds().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => writeIds([]), []);

  return { ids, count: ids.length, max: MAX_ITEMS, has, toggle, remove, clear };
};
