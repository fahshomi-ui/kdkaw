import { useEffect, useState, useCallback } from 'react';

const KEY = 'makani_recently_viewed_v1';
const MAX = 12;

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
};

const write = (ids: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('recently-viewed-changed'));
  } catch {}
};

export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener('recently-viewed-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('recently-viewed-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const track = useCallback((id: string) => {
    if (!id) return;
    const current = read();
    const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX);
    write(next);
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, count: ids.length, track, clear };
};
