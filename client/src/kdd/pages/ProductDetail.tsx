import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Snowflake,
  Truck,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/kdd/components/Layout";
import ProductCard from "@/kdd/components/ProductCard";
import { ErrorState, LoadingState } from "@/kdd/components/CatalogState";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { useCart } from "@/kdd/contexts/CartContext";
import {
  useProduct,
  useProductImages,
  useProducts,
} from "@/kdd/hooks/useStore";

const PREPS = [
  { id: "clean", ar: "تنظيف", en: "Cleaning" },
  { id: "skin", ar: "سلخ", en: "Skinning" },
  { id: "fillet", ar: "فيليه", en: "Filleting" },
  { id: "slice", ar: "شرائح", en: "Slicing" },
];

export default function ProductDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const productQuery = useProduct(id);
  const imagesQuery = useProductImages(id);
  const allProductsQuery = useProducts("all");
  const [quantity, setQuantity] = useState(1);
  const [active, setActive] = useState(0);
  const [preparations, setPreparations] = useState<string[]>([]);
  const product = productQuery.data as any;
  const gallery = useMemo(() => {
    const images = ((imagesQuery.data ?? []) as any[])
      .map(image => image.image_url)
      .filter(Boolean);
    return images.length
      ? images
      : product?.image_url
        ? [product.image_url]
        : [];
  }, [imagesQuery.data, product?.image_url]);
  const related = useMemo(
    () =>
      ((allProductsQuery.data ?? []) as any[])
        .filter(
          item =>
            item.category_id === product?.category_id && item.id !== product?.id
        )
        .slice(0, 10),
    [allProductsQuery.data, product?.category_id, product?.id]
  );

  if (productQuery.isLoading && !product) {
    return (
      <Layout>
        <div className="kdd-container py-10">
          <LoadingState />
        </div>
      </Layout>
    );
  }
  if (productQuery.error && !product) {
    return (
      <Layout>
        <div className="kdd-container py-10">
          <ErrorState message={productQuery.error} />
        </div>
      </Layout>
    );
  }
  if (!product) {
    return (
      <Layout>
        <div className="kdd-container py-20 text-center">
          {lang === "ar" ? "المنتج غير موجود." : "Product not found."}
        </div>
      </Layout>
    );
  }

  const name = lang === "ar" ? product.name_ar : product.name_en;
  const description =
    lang === "ar" ? product.description_ar : product.description_en;
  const categoryName = product.category
    ? lang === "ar"
      ? product.category.name_ar
      : product.category.name_en
    : "";
  const price = Number(product.price || 0);
  const oldPrice = Number(product.old_price || 0);
  const discounted = oldPrice > price;
  const discountPercent = discounted
    ? Math.round((1 - price / oldPrice) * 100)
    : 0;
  const add = () =>
    addItem(product, quantity, preparations.length ? preparations : undefined);

  return (
    <Layout>
      <div className="kdd-container py-5 pb-24 md:py-10 md:pb-10">
        <nav className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="font-bold hover:text-primary">
            {lang === "ar" ? "الرئيسية" : "Home"}
          </Link>
          {categoryName && (
            <>
              <span>/</span>
              <Link
                to={`/category/${product.category?.slug}`}
                className="hover:text-primary"
              >
                {categoryName}
              </Link>
            </>
          )}
        </nav>
        <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-white">
              {gallery.length ? (
                <img
                  src={gallery[active] || gallery[0]}
                  alt={name}
                  className="h-72 w-full object-contain p-4 sm:h-96 md:h-[520px] md:p-8"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-muted-foreground">
                  {lang === "ar"
                    ? "لا توجد صورة لهذا المنتج"
                    : "No product image"}
                </div>
              )}
              {discounted && (
                <span className="absolute start-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                  -{discountPercent || 50}%
                </span>
              )}
              {!product.in_stock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <span className="rounded-xl bg-destructive px-5 py-2 font-bold text-destructive-foreground">
                    {t("products.outOfStock")}
                  </span>
                </div>
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActive((active - 1 + gallery.length) % gallery.length)
                    }
                    className="absolute start-2 top-1/2 flex -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive((active + 1) % gallery.length)}
                    className="absolute end-2 top-1/2 flex -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex justify-center gap-2">
                {gallery.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Image ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${active === index ? "w-8 bg-primary" : "w-1.5 bg-border"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="inline-block border-b-2 border-primary pb-1 text-xs font-bold uppercase tracking-widest text-primary">
              {product.vendor || categoryName || "KDD"}
            </div>
            <h1 className="text-2xl font-black leading-tight md:text-4xl lg:text-5xl">
              {name}
            </h1>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-xl font-extrabold text-foreground md:text-2xl">
                {price.toFixed(3)} {t("products.kwd")}
                {product.weight && (
                  <span className="text-base text-foreground/70">
                    /{product.weight}
                  </span>
                )}
              </span>
              {discounted && (
                <span className="text-base text-muted-foreground line-through">
                  {oldPrice.toFixed(3)} {t("products.kwd")}
                </span>
              )}
            </div>
            {product.weight && (
              <p className="text-sm">
                <span className="font-bold">
                  {lang === "ar" ? "الوزن:" : "Weight:"}
                </span>{" "}
                <span className="text-muted-foreground">{product.weight}</span>
              </p>
            )}
            <div className="rounded-2xl border border-border/50 bg-muted/60 px-4 py-3.5 text-xs italic leading-relaxed text-foreground/80">
              {lang === "ar"
                ? `سعر الوحدة ${price.toFixed(3)} د.ك.`
                : `The unit price is ${price.toFixed(3)} KWD.`}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold">
                {lang === "ar" ? "نوع التعبئة" : "Pack Type"}
              </label>
              <span className="inline-flex rounded-full border-2 border-foreground px-5 py-2 text-sm font-bold">
                {product.weight || (lang === "ar" ? "قطعة" : "1 Piece")}
              </span>
            </div>
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-bold">
                {t("products.quantity")}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-14 w-full items-center justify-between overflow-hidden rounded-full border-2 border-border bg-background sm:w-36">
                  <button
                    type="button"
                    className="flex h-full w-12 items-center justify-center hover:bg-muted"
                    onClick={() => setQuantity(value => Math.max(1, value - 1))}
                    aria-label="Decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-black">{quantity}</span>
                  <button
                    type="button"
                    className="flex h-full w-12 items-center justify-center hover:bg-muted"
                    onClick={() =>
                      setQuantity(value => Math.min(99, value + 1))
                    }
                    aria-label="Increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!product.in_stock}
                  onClick={add}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-base font-extrabold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.in_stock
                    ? t("products.addToCart")
                    : t("products.outOfStock")}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold">
                {lang === "ar"
                  ? "خيارات التحضير (اختياري)"
                  : "Preparation options (optional)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {PREPS.map(prep => {
                  const selected = preparations.includes(prep.id);
                  return (
                    <button
                      type="button"
                      key={prep.id}
                      onClick={() =>
                        setPreparations(current =>
                          selected
                            ? current.filter(value => value !== prep.id)
                            : [...current, prep.id]
                        )
                      }
                      className={`rounded-full border-2 px-3 py-2 text-xs font-bold transition-colors ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}
                    >
                      {lang === "ar" ? prep.ar : prep.en}
                    </button>
                  );
                })}
              </div>
            </div>
            <details open className="border-t border-border pt-2">
              <summary className="cursor-pointer py-4 text-base font-extrabold">
                {lang === "ar" ? "الوصف" : "Description"}
              </summary>
              <div className="space-y-4 pb-4">
                {product.origin && (
                  <p className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {product.origin}
                  </p>
                )}
                <p className="text-sm leading-7 text-muted-foreground">
                  {description ||
                    (lang === "ar"
                      ? "منتج من تشكيلة كي دي دي."
                      : "A product from the KDD collection.")}
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5">
                    <Snowflake className="h-3.5 w-3.5 text-primary" />
                    {lang === "ar" ? "جودة مختارة" : "Selected quality"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    {lang === "ar" ? "توصيل اليوم" : "Same-day delivery"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 ${product.in_stock ? "border-emerald-300 text-emerald-700" : "border-destructive/30 text-destructive"}`}
                  >
                    {product.in_stock ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    {product.in_stock
                      ? lang === "ar"
                        ? "متوفر"
                        : "In Stock"
                      : t("products.outOfStock")}
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-black">
              {t("products.relatedProducts")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {related.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
