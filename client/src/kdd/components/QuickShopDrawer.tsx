import { useEffect, useState } from "react";
import { Check, Minus, Plus, ShoppingCart, X } from "lucide-react";
import type { DbProduct } from "@/kdd/lib/types";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { useCart } from "@/kdd/contexts/CartContext";
import fallbackProductImage from "@/kdd/assets/kdd-hero-dairy.jpg";

interface QuickShopDrawerProps {
  product: DbProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickShopDrawer({
  product,
  open,
  onOpenChange,
}: QuickShopDrawerProps) {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuantity(1);
    setAdded(false);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange, product?.id]);

  if (!open || !product) return null;

  const name = lang === "ar" ? product.name_ar : product.name_en;
  const currentPrice = Number(product.price || 0);
  const previousPrice = Number(product.old_price || 0);
  const hasPreviousPrice = previousPrice > currentPrice;
  const total = (currentPrice * quantity).toFixed(3);

  const handleAdd = () => {
    if (!product.in_stock) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      setQuantity(1);
      onOpenChange(false);
    }, 750);
  };

  return (
    <div
      className="fixed inset-0 z-[80]"
      dir={lang === "ar" ? "rtl" : "ltr"}
      role="presentation"
    >
      <button
        type="button"
        aria-label={lang === "ar" ? "إغلاق الشراء السريع" : "Close quick shop"}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/45 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="kdd-quick-shop-title"
        className="absolute inset-y-0 end-0 flex w-full max-w-[27rem] flex-col border-s bg-card text-foreground shadow-2xl animate-in slide-in-from-end duration-200"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="kdd-quick-shop-title" className="text-base font-black">
            {lang === "ar" ? "شراء سريع" : "Quick Shop"}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={lang === "ar" ? "إغلاق" : "Close"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-start gap-3">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
              <img
                src={product.image_url || fallbackProductImage}
                alt={name}
                className="h-full w-full object-contain p-2"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-3 text-sm font-extrabold leading-relaxed">
                {name}
              </h3>
              {product.origin && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {product.origin}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-black tabular-nums text-primary">
                  {currentPrice.toFixed(3)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("products.kwd")}
                </span>
                {hasPreviousPrice && (
                  <span className="text-xs tabular-nums text-muted-foreground line-through">
                    {previousPrice.toFixed(3)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {lang === "ar" ? "الكمية" : "Quantity"}
              </span>
              <span className="text-[11px] text-muted-foreground">1–99</span>
            </div>
            <div className="flex items-center justify-between overflow-hidden rounded-xl border border-border bg-card">
              <button
                type="button"
                aria-label={
                  lang === "ar" ? "تقليل الكمية" : "Decrease quantity"
                }
                onClick={() => setQuantity(value => Math.max(1, value - 1))}
                className="flex h-11 w-12 items-center justify-center transition-colors hover:bg-primary/10 active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-base font-black tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label={
                  lang === "ar" ? "زيادة الكمية" : "Increase quantity"
                }
                onClick={() => setQuantity(value => Math.min(99, value + 1))}
                className="flex h-11 w-12 items-center justify-center transition-colors hover:bg-primary/10 active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs font-bold text-muted-foreground">
              {lang === "ar" ? "الإجمالي" : "Total"}
            </span>
            <span className="text-xl font-black tabular-nums text-primary">
              {total}{" "}
              <span className="text-[10px] font-bold">{t("products.kwd")}</span>
            </span>
          </div>
        </div>

        <div className="border-t border-border p-5">
          <button
            type="button"
            disabled={!product.in_stock}
            onClick={handleAdd}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-primary-foreground transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${added ? "bg-emerald-600" : "bg-primary hover:bg-primary/90"}`}
          >
            {added ? (
              <Check className="h-5 w-5" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
            {added
              ? lang === "ar"
                ? "تمت الإضافة!"
                : "Added!"
              : t("products.addToCart")}
          </button>
        </div>
      </aside>
    </div>
  );
}
