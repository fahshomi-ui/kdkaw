import { useState } from "react";
import {
  GitCompare,
  Heart,
  ShoppingCart,
  Sparkles,
  Check,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DbProduct } from "@/kdd/lib/types";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { useCart } from "@/kdd/contexts/CartContext";
import fallbackProductImage from "@/kdd/assets/kdd-hero-dairy.jpg";
import QuickShopDrawer from "@/kdd/components/QuickShopDrawer";
import { useCompare, useWishlist } from "@/kdd/hooks/useLocalCollections";
import BrandedImage from "@/kdd/components/BrandedImage";

export default function ProductCard({
  product,
  index = 0,
}: {
  product: DbProduct;
  index?: number;
}) {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const productId = String(product.id);
  const wished = wishlist.has(productId);
  const compared = compare.has(productId);
  const [justAdded, setJustAdded] = useState(false);
  const [quickShopOpen, setQuickShopOpen] = useState(false);
  const p = product as any;
  const name = lang === "ar" ? p.name_ar : p.name_en;
  const price = Number(p.price || 0);
  const oldPrice = Number(p.old_price || 0);
  const discounted = oldPrice > price;
  const discountPercent = discounted
    ? Math.round((1 - price / oldPrice) * 100)
    : 0;

  const add = () => {
    if (!p.in_stock) return;
    addItem(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };
  const stop = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <article
        className="kdd-product-card group"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="absolute end-2.5 top-2.5 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label={lang === "ar" ? "أضف للمفضلة" : "Add to wishlist"}
            aria-pressed={wished}
            onClick={event => {
              stop(event);
              wishlist.toggle(productId);
            }}
            className={`kdd-product-action ${wished ? "bg-rose-500 text-white" : "bg-card/95 text-foreground hover:bg-rose-500 hover:text-white"}`}
          >
            <Heart className={`h-3.5 w-3.5 ${wished ? "fill-current" : ""}`} />
          </button>
          <button
            type="button"
            aria-label={lang === "ar" ? "أضف للمقارنة" : "Add to compare"}
            aria-pressed={compared}
            onClick={event => {
              stop(event);
              compare.toggle(productId, lang);
            }}
            className={`kdd-product-action ${compared ? "bg-primary text-primary-foreground" : "bg-card/95 text-foreground hover:bg-primary hover:text-primary-foreground"}`}
          >
            <GitCompare className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="absolute start-2.5 top-2.5 z-20 flex flex-col gap-1.5">
          {discounted && (
            <span className="kdd-discount-badge">
              -{discountPercent || 50}%
            </span>
          )}
          {p.featured && (
            <span className="kdd-featured-badge">
              <Sparkles className="h-2.5 w-2.5" />
              {lang === "ar" ? "مميز" : "Featured"}
            </span>
          )}
        </div>

        <Link to={`/product/${p.id}`} className="block">
          <div className="kdd-product-image-wrap">
            <BrandedImage
              src={p.image_url || fallbackProductImage}
              alt={name}
              className="w-full aspect-square object-cover group-hover:scale-[1.04]"
              size="sm"
              lang={lang}
            />
            <span className="kdd-origin-chip">{p.origin || "KDD"}</span>
            {!p.in_stock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
                <span className="rounded-xl bg-destructive px-4 py-1.5 text-xs font-bold text-destructive-foreground shadow-xl">
                  {t("products.outOfStock")}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <Link to={`/product/${p.id}`} className="flex-1">
            <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug transition-colors group-hover:text-primary">
              {name}
            </h3>
          </Link>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold tabular-nums text-primary">
              {price.toFixed(3)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t("products.kwd")}
            </span>
            {discounted && (
              <span className="ms-auto text-[11px] tabular-nums text-muted-foreground/65 line-through">
                {oldPrice.toFixed(3)}
              </span>
            )}
          </div>
          {p.in_stock ? (
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={event => {
                  stop(event);
                  setQuickShopOpen(true);
                }}
                aria-label={lang === "ar" ? "شراء سريع" : "Quick Shop"}
                className="col-span-2 flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs font-bold transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">
                  {lang === "ar" ? "سريع" : "Quick"}
                </span>
              </button>
              <button
                type="button"
                onClick={event => {
                  stop(event);
                  add();
                }}
                className={`col-span-3 flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-primary-foreground transition-all active:scale-95 ${justAdded ? "bg-emerald-600" : "bg-primary hover:bg-primary/90"}`}
              >
                {justAdded ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5" />
                )}
                <span>
                  {justAdded
                    ? lang === "ar"
                      ? "تمت!"
                      : "Added!"
                    : t("products.addToCart")}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </article>
      <QuickShopDrawer
        product={product}
        open={quickShopOpen}
        onOpenChange={setQuickShopOpen}
      />
    </>
  );
}
