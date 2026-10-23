import { GitCompare, Heart, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { DbProduct } from "@/kdd/lib/types";
import fallbackProductImage from "@/kdd/assets/kdd-hero-dairy.jpg";

type PanelKind = "wishlist" | "compare";

interface LocalCollectionPanelProps {
  kind: PanelKind;
  products: DbProduct[];
  lang: "ar" | "en";
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function LocalCollectionPanel({
  kind,
  products,
  lang,
  onRemove,
  onClose,
}: LocalCollectionPanelProps) {
  const wishlist = kind === "wishlist";
  const title = wishlist
    ? lang === "ar"
      ? "المفضلة"
      : "Wishlist"
    : lang === "ar"
      ? "المقارنة"
      : "Compare";
  const empty = wishlist
    ? lang === "ar"
      ? "لم تضف منتجات للمفضلة بعد."
      : "No products in your wishlist yet."
    : lang === "ar"
      ? "لم تضف منتجات للمقارنة بعد."
      : "No products to compare yet.";

  return (
    <div
      className="absolute end-0 top-12 z-[60] w-[min(92vw,25rem)] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl"
      role="dialog"
      aria-label={title}
      onClick={event => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {wishlist ? (
              <Heart className="h-4 w-4 fill-current" />
            ) : (
              <GitCompare className="h-4 w-4" />
            )}
          </span>
          <div>
            <h3 className="text-sm font-black">{title}</h3>
            <p className="text-[10px] text-muted-foreground">
              {products.length}{" "}
              {lang === "ar"
                ? "منتجات"
                : products.length === 1
                  ? "product"
                  : "products"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === "ar" ? "إغلاق" : "Close"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {products.length === 0 ? (
        <div className="px-5 py-9 text-center text-xs text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="max-h-[min(60vh,24rem)] divide-y divide-border overflow-y-auto">
          {products.map(product => {
            const name = lang === "ar" ? product.name_ar : product.name_en;
            const currentPrice = Number(product.price || 0);
            const previousPrice = Number(product.old_price || 0);
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Link
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-white"
                >
                  <img
                    src={product.image_url || fallbackProductImage}
                    alt={name}
                    className="h-full w-full object-contain p-1"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="line-clamp-2 text-xs font-bold hover:text-primary"
                  >
                    {name}
                  </Link>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xs font-black tabular-nums text-primary">
                      {currentPrice.toFixed(3)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      KWD
                    </span>
                    {previousPrice > currentPrice && (
                      <span className="text-[10px] tabular-nums text-muted-foreground line-through">
                        {previousPrice.toFixed(3)}
                      </span>
                    )}
                  </div>
                  {!wishlist && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {product.in_stock
                        ? lang === "ar"
                          ? "متوفر"
                          : "In stock"
                        : lang === "ar"
                          ? "غير متوفر"
                          : "Out of stock"}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(product.id)}
                  aria-label={`${lang === "ar" ? "إزالة" : "Remove"} ${name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
