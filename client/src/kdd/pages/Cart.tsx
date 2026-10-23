import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Scissors,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import Layout from "@/kdd/components/Layout";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { cartLineKey, useCart } from "@/kdd/contexts/CartContext";
import { useCoupon } from "@/kdd/hooks/useStore";
import cartHero from "@/kdd/assets/cart-hero.jpg";
import fallbackProductImage from "@/kdd/assets/kdd-hero-dairy.jpg";

const PREP_LABELS: Record<string, { ar: string; en: string }> = {
  clean: { ar: "تنظيف", en: "Cleaning" },
  skin: { ar: "سلخ", en: "Skinning" },
  fillet: { ar: "فيليه", en: "Filleting" },
  slice: { ar: "شرائح", en: "Slicing" },
};

export default function Cart() {
  const { lang, t } = useLanguage();
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    discount,
    couponCode,
    setCouponDiscount,
    removeCoupon,
    deliveryFee,
    total,
    preparationFees,
  } = useCart();
  const { validateCoupon } = useCoupon();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const coupon = await validateCoupon(couponInput.trim());
      if (coupon) {
        setCouponDiscount(coupon.code, Number(coupon.discount_percent || 0));
        setCouponInput("");
        setCouponError("");
      } else
        setCouponError(
          lang === "ar" ? "رمز الخصم غير صالح." : "Invalid coupon code."
        );
    } catch (error) {
      setCouponError(
        error instanceof Error
          ? error.message
          : lang === "ar"
            ? "تعذر التحقق من الرمز."
            : "Could not validate the code."
      );
    }
  };
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;
  return (
    <Layout hideFooter>
      <section className="relative isolate overflow-hidden">
        <img
          src={cartHero}
          alt=""
          className="absolute inset-0 -z-20 h-56 w-full object-cover md:h-72"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-background/95 via-background/75 to-background/20" />
        <div className="kdd-container flex h-56 flex-col justify-center md:h-72">
          <h1 className="text-3xl font-black md:text-5xl">
            {lang === "ar" ? "سلة التسوق" : "Shopping cart"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "ar"
              ? "راجع اختياراتك قبل إرسال الطلب."
              : "Review your choices before sending the order."}
          </p>
        </div>
      </section>
      {!items.length ? (
        <div className="kdd-container py-24 text-center">
          <ShoppingBag className="mx-auto mb-5 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-2xl font-black">{t("cart.empty")}</h2>
          <Link
            to="/products"
            className="mt-7 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="kdd-container py-7 pb-28 lg:pb-10">
          <div className="mb-5 flex justify-end">
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <Back className="h-4 w-4" />
              {t("cart.continueShopping")}
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {items.map(item => {
                const name =
                  lang === "ar"
                    ? (item.product as any).name_ar
                    : (item.product as any).name_en;
                return (
                  <div
                    key={cartLineKey(item)}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex gap-3">
                      <img
                        src={
                          (item.product as any).image_url ||
                          fallbackProductImage
                        }
                        alt={name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <div>
                            <h2 className="font-bold">{name}</h2>
                            {(item.product as any).weight && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {(item.product as any).weight}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(cartLineKey(item))}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={lang === "ar" ? "حذف" : "Remove"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.preparations?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                            <Scissors className="h-3.5 w-3.5 text-primary" />
                            {item.preparations.map(prep => (
                              <span
                                key={prep}
                                className="rounded bg-primary/10 px-1.5 py-0.5 text-primary"
                              >
                                {PREP_LABELS[prep]?.[lang] ?? prep}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center rounded-xl border border-border">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  cartLineKey(item),
                                  item.quantity - 1
                                )
                              }
                              className="p-2"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-black">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  cartLineKey(item),
                                  item.quantity + 1
                                )
                              }
                              className="p-2"
                              aria-label="Increase"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-black text-primary">
                            {(
                              Number((item.product as any).price || 0) *
                              item.quantity
                            ).toFixed(3)}{" "}
                            {t("products.kwd")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <h2 className="text-lg font-black">
                {lang === "ar" ? "ملخص الطلب" : "Order summary"}
              </h2>
              <div className="mt-5">
                <label className="mb-2 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  {t("cart.coupon")}
                </label>
                {couponCode ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary">
                    <span>{couponCode}</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label={lang === "ar" ? "حذف الرمز" : "Remove coupon"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={event => {
                        setCouponInput(event.target.value);
                        setCouponError("");
                      }}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                      placeholder={lang === "ar" ? "الرمز" : "Code"}
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                    >
                      {t("cart.applyCoupon")}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-xs font-bold text-destructive">
                    {couponError}
                  </p>
                )}
              </div>
              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cart.subtotal")}
                  </span>
                  <strong>
                    {subtotal.toFixed(3)} {t("products.kwd")}
                  </strong>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("cart.discount")}
                    </span>
                    <strong className="text-emerald-600">
                      -{discount.toFixed(3)} {t("products.kwd")}
                    </strong>
                  </div>
                )}
                {preparationFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {lang === "ar" ? "رسوم التحضير" : "Preparation"}
                    </span>
                    <strong>
                      {preparationFees.toFixed(3)} {t("products.kwd")}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cart.delivery")}
                  </span>
                  <strong>
                    {deliveryFee.toFixed(3)} {t("products.kwd")}
                  </strong>
                </div>
                <div className="flex justify-between border-t border-border pt-4 text-lg">
                  <span className="font-black">{t("cart.total")}</span>
                  <strong className="text-primary">
                    {total.toFixed(3)} {t("products.kwd")}
                  </strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-6 w-full rounded-xl bg-primary py-3 font-black text-primary-foreground"
              >
                {t("cart.checkout")}
              </button>
            </aside>
          </div>
        </div>
      )}
    </Layout>
  );
}
