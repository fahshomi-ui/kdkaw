import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DbProduct } from "@/kdd/lib/types";
import { getCheckoutPriceSummary } from "@/kdd/lib/checkoutPricing";
import { syncCart } from "@/kdd/lib/socketClient";
import { useProducts } from "@/kdd/hooks/useStore";

export type CartItem = {
  product: DbProduct;
  quantity: number;
  preparations?: string[];
};

export function cartLineKey(item: {
  product: DbProduct;
  preparations?: string[];
}) {
  return JSON.stringify([
    item.product.id,
    [...(item.preparations ?? [])].sort(),
  ]);
}

type CartContextValue = {
  items: CartItem[];
  addItem: (
    product: DbProduct,
    quantity?: number,
    preparations?: string[]
  ) => void;
  removeItem: (identifier: string) => void;
  updateQuantity: (identifier: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  preparationFees: number;
  discount: number;
  discountPercent: number;
  couponCode: string;
  setCouponDiscount: (code: string, percent: number) => void;
  removeCoupon: () => void;
  deliveryFee: number;
  total: number;
};

const CART_KEY = "kdd-cart-v1";
const COUPON_KEY = "kdd-coupon-v1";
const DELIVERY_FEE = 0;
const MAX_QUANTITY = 99;
const PREPARATION_PRICES: Record<string, number> = {
  clean: 0,
  skin: 0.25,
  fillet: 0.5,
  slice: 0.25,
  grill_ready: 0.25,
  head_remove: 0.15,
  peel: 0.2,
  devein: 0.5,
};

function preparationFees(item: CartItem) {
  return (
    (item.preparations ?? []).reduce(
      (sum, id) => sum + (PREPARATION_PRICES[id] ?? 0),
      0
    ) * item.quantity
  );
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: catalogProducts } = useProducts();
  const productsById = useMemo(
    () =>
      new Map((catalogProducts || []).map(product => [product.id, product])),
    [catalogProducts]
  );
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed)
        ? parsed
            .filter(item => item?.product?.id)
            .map(item => ({
              ...item,
              product: productsById.get(item.product.id) || item.product,
              quantity: Math.min(
                MAX_QUANTITY,
                Math.max(1, Number(item.quantity) || 1)
              ),
            }))
        : [];
    } catch {
      return [];
    }
  });
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    setItems(current => {
      let changed = false;
      const updated = current.map(item => {
        const product = productsById.get(item.product.id);
        if (!product || product === item.product) return item;
        changed = true;
        return { ...item, product };
      });
      return changed ? updated : current;
    });
  }, [productsById]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
      if (mounted.current) {
        syncCart({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            ...(item.preparations?.length
              ? { preparations: item.preparations }
              : {}),
          })),
        });
      }
    } catch {
      // Storage and socket availability are both optional for the storefront UI.
    }
    mounted.current = true;
  }, [items]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(COUPON_KEY) || "{}");
      if (typeof saved?.code === "string") setCouponCode(saved.code);
      if (typeof saved?.percent === "number") setDiscountPercent(saved.percent);
    } catch {
      // Ignore malformed local coupon state.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        COUPON_KEY,
        JSON.stringify({ code: couponCode, percent: discountPercent })
      );
    } catch {
      // Ignore unavailable storage.
    }
  }, [couponCode, discountPercent]);

  const addItem = useCallback(
    (product: DbProduct, quantity = 1, preparations?: string[]) => {
      const normalized = [...(preparations ?? [])].sort();
      const lineKey = cartLineKey({ product, preparations: normalized });
      setItems(current => {
        const match = current.find(item => cartLineKey(item) === lineKey);
        if (match)
          return current.map(item =>
            item === match
              ? {
                  ...item,
                  quantity: Math.min(
                    MAX_QUANTITY,
                    Math.max(1, item.quantity + quantity)
                  ),
                }
              : item
          );
        return [
          ...current,
          {
            product,
            quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)),
            ...(normalized.length ? { preparations: normalized } : {}),
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback(
    (identifier: string) =>
      setItems(current =>
        current.filter(
          item =>
            cartLineKey(item) !== identifier &&
            !(item.product.id === identifier && !item.preparations?.length)
        )
      ),
    []
  );
  const updateQuantity = useCallback(
    (identifier: string, quantity: number) => {
      if (quantity <= 0) return removeItem(identifier);
      setItems(current =>
        current.map(item =>
          cartLineKey(item) === identifier ||
          (item.product.id === identifier && !item.preparations?.length)
            ? {
                ...item,
                quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)),
              }
            : item
        )
      );
    },
    [removeItem]
  );
  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const salePricing = getCheckoutPriceSummary(items);
    const couponDiscount = salePricing.subtotal * (discountPercent / 100);
    const pricing = getCheckoutPriceSummary(items, couponDiscount);
    const subtotal = pricing.baseSubtotal;
    const prep = items.reduce((sum, item) => sum + preparationFees(item), 0);
    const discount = pricing.combinedDiscount;
    return {
      subtotal,
      preparationFees: prep,
      discount,
      deliveryFee: items.length ? DELIVERY_FEE : 0,
      total:
        Math.max(0, pricing.baseSubtotal - pricing.combinedDiscount) +
        prep +
        (items.length ? DELIVERY_FEE : 0),
    };
  }, [discountPercent, items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      ...totals,
      discountPercent,
      couponCode,
      setCouponDiscount: (code, percent) => {
        setCouponCode(code);
        setDiscountPercent(percent);
      },
      removeCoupon: () => {
        setCouponCode("");
        setDiscountPercent(0);
      },
    }),
    [
      addItem,
      clearCart,
      couponCode,
      discountPercent,
      items,
      removeItem,
      totals,
      updateQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
