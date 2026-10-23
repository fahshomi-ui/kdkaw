import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'makani_wishlist_v1';

const readIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const writeIds = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('wishlist-changed'));
  } catch {
    /* ignore */
  }
};

export const useWishlist = () => {
  const [ids, setIds] = useState<string[]>(() => readIds());

  useEffect(() => {
    const sync = () => setIds(readIds());
    window.addEventListener('wishlist-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('wishlist-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readIds();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    writeIds(next);
  }, []);

  const remove = useCallback((id: string) => {
    writeIds(readIds().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => writeIds([]), []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, remove, clear, has };
};