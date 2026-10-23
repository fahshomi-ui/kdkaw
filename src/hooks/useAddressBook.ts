import { useEffect, useState, useCallback } from 'react';

const KEY = 'makani_address_book_v1';

export interface SavedAddressEntry {
  id: string;
  label: string;
  name: string;
  phone: string;
  area: string;
  block: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  notes: string;
  isDefault?: boolean;
}

const read = (): SavedAddressEntry[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};

const write = (entries: SavedAddressEntry[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('address-book-changed'));
  } catch {}
};

export const useAddressBook = () => {
  const [addresses, setAddresses] = useState<SavedAddressEntry[]>(() => read());

  useEffect(() => {
    const sync = () => setAddresses(read());
    window.addEventListener('address-book-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('address-book-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((label: string, addr: Omit<SavedAddressEntry, 'id' | 'label'>) => {
    const entry: SavedAddressEntry = {
      id: crypto.randomUUID(),
      label: label.trim() || 'العنوان',
      ...addr,
    };
    const current = read();
    if (current.length === 0) entry.isDefault = true;
    write([entry, ...current]);
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((a) => a.id !== id));
  }, []);

  const setDefault = useCallback((id: string) => {
    write(read().map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

  return { addresses, count: addresses.length, save, remove, setDefault, defaultAddress };
};
