import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

const WISHLIST_KEY = "makani_wishlist_v1";
const COMPARE_KEY = "makani_compare_v1";
const COLLECTIONS_CHANGED = "kdd-local-collections-changed";
export const MAX_COMPARE_ITEMS = 4;

type CollectionState = {
  wishlist: string[];
  compare: string[];
};

type CollectionName = keyof CollectionState;

const emptyState: CollectionState = { wishlist: [], compare: [] };

function readIds(key: string, max?: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) return [];
    const ids = value.filter((id): id is string => typeof id === "string");
    const uniqueIds = Array.from(new Set(ids));
    return max ? uniqueIds.slice(0, max) : uniqueIds;
  } catch {
    return [];
  }
}

function readState(): CollectionState {
  return {
    wishlist: readIds(WISHLIST_KEY),
    compare: readIds(COMPARE_KEY, MAX_COMPARE_ITEMS),
  };
}

let state: CollectionState = readState();
const listeners = new Set<() => void>();

function sameIds(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

function notify() {
  listeners.forEach(listener => listener());
}

function refreshFromStorage() {
  const next = readState();
  if (
    sameIds(state.wishlist, next.wishlist) &&
    sameIds(state.compare, next.compare)
  )
    return;
  state = next;
  notify();
}

function persist(name: CollectionName, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  const normalized =
    name === "compare" ? uniqueIds.slice(0, MAX_COMPARE_ITEMS) : uniqueIds;
  const key = name === "wishlist" ? WISHLIST_KEY : COMPARE_KEY;
  try {
    window.localStorage.setItem(key, JSON.stringify(normalized));
  } catch {
    // Local-only controls should still work if storage is unavailable.
  }
  state = { ...state, [name]: normalized };
  notify();
  window.dispatchEvent(new Event(COLLECTIONS_CHANGED));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener(COLLECTIONS_CHANGED, refreshFromStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener(COLLECTIONS_CHANGED, refreshFromStorage);
    }
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return emptyState;
}

export function useWishlist() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const ids = snapshot.wishlist;

  const toggle = useCallback((id: string) => {
    const current = state.wishlist;
    persist(
      "wishlist",
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  }, []);
  const remove = useCallback(
    (id: string) =>
      persist(
        "wishlist",
        state.wishlist.filter(item => item !== id)
      ),
    []
  );
  const clear = useCallback(() => persist("wishlist", []), []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, remove, clear, has };
}

export function useCompare() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const ids = snapshot.compare;

  const toggle = useCallback((id: string, lang: "ar" | "en" = "ar") => {
    const current = state.compare;
    if (current.includes(id)) {
      persist(
        "compare",
        current.filter(item => item !== id)
      );
      return;
    }
    if (current.length >= MAX_COMPARE_ITEMS) {
      toast.error(
        lang === "ar"
          ? `يمكنك مقارنة ${MAX_COMPARE_ITEMS} منتجات كحد أقصى`
          : `You can compare up to ${MAX_COMPARE_ITEMS} products`
      );
      return;
    }
    persist("compare", [...current, id]);
    toast.success(lang === "ar" ? "تمت إضافته للمقارنة" : "Added to compare");
  }, []);
  const remove = useCallback(
    (id: string) =>
      persist(
        "compare",
        state.compare.filter(item => item !== id)
      ),
    []
  );
  const clear = useCallback(() => persist("compare", []), []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return {
    ids,
    count: ids.length,
    max: MAX_COMPARE_ITEMS,
    toggle,
    remove,
    clear,
    has,
  };
}
