import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Package,
  Scissors,
  ShieldCheck,
  StickyNote,
  Truck,
  User,
} from "lucide-react";
import Layout from "@/kdd/components/Layout";
import CheckoutConfirmationModal, {
  type ConfirmationDetails,
} from "@/kdd/components/CheckoutConfirmationModal";
import { Input } from "@/kdd/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/kdd/components/ui/select";
import DeliveryWindowPicker, {
  formatSlot,
  isDeliverySlotAvailable,
  type DeliverySlot,
} from "@/kdd/components/DeliveryWindowPicker";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { cartLineKey, useCart } from "@/kdd/contexts/CartContext";
import { createOrder, useConnectionStatus } from "@/kdd/hooks/useStore";
import { getCheckoutPriceSummary } from "@/kdd/lib/checkoutPricing";
import { newRequestId } from "@/kdd/lib/storeUtils";
import type { OrderDraft, OrderReceipt } from "@/kdd/lib/types";
import { KUWAIT_AREAS } from "@/kdd/data/kuwaitAreas";
import { KUWAIT_GOVERNORATES } from "@/kdd/data/kuwaitGovernorates";
import checkoutHero from "@/kdd/assets/checkout-hero.jpg";
import knetLogo from "@/kdd/assets/knet-checkout-logo.png";
import visaLogo from "@/kdd/assets/visa-logo.png";
import mastercardLogo from "@/kdd/assets/mastercard-logo.png";

interface CustomerForm {
  name: string;
  phone: string;
  area: string;
  block: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  notes: string;
}
const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  area: "",
  block: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  notes: "",
};
type ReviewedOrder = Omit<OrderDraft, "requestId">;

function CheckoutHero({ lang }: { lang: "ar" | "en" }) {
  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label={lang === "ar" ? "إتمام الطلب" : "Checkout"}
    >
      <div className="relative h-[160px] md:h-[260px] w-full">
        <img
          src={checkoutHero}
          alt={lang === "ar" ? "إتمام الطلب الآمن" : "Secure checkout"}
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 self-start bg-primary/15 backdrop-blur-sm border border-primary/30 rounded-full px-3 py-1 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] md:text-xs font-cairo font-bold text-primary">
              {lang === "ar" ? "معلومات التوصيل" : "Delivery details"}
            </span>
          </div>
          <h1 className="text-2xl md:text-5xl font-black font-cairo text-foreground leading-tight">
            {lang === "ar" ? "إتمام الطلب" : "Complete Your Order"}
          </h1>
          <p className="mt-2 text-xs md:text-base text-muted-foreground font-cairo max-w-xl">
            {lang === "ar"
              ? "خطوة أخيرة لاستلام طلبك الطازج عند بابك"
              : "One last step to get your fresh order delivered to your door"}
          </p>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  icon,
  children,
}: {
  number: number;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-muted/20">
        <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-cairo font-black text-xs">
          {number}
        </div>
        <h2 className="font-cairo font-black text-foreground text-sm flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
      </div>
      <div className="p-3 space-y-4">{children}</div>
    </section>
  );
}

export default function Checkout() {
  const { lang, t } = useLanguage();
  const cart = useCart();
  const {
    items,
    discount,
    couponCode,
    preparationFees,
    deliveryFee,
    total,
    clearCart,
  } = cart;
  const connection = useConnectionStatus();
  const serverReady = connection === "connected";
  const [form, setForm] = useState<CustomerForm>({ ...EMPTY_FORM });
  const [governorate, setGovernorate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"knet" | "card">("knet");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [reviewedOrder, setReviewedOrder] = useState<ReviewedOrder | null>(
    null
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reviewDetails, setReviewDetails] =
    useState<ConfirmationDetails | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const attempt = useRef<{ fingerprint: string; requestId: string } | null>(
    null
  );
  const selectedGov = KUWAIT_GOVERNORATES.find(gov => gov.en === governorate);
  const filteredAreas = selectedGov ? selectedGov.areas : KUWAIT_AREAS;
  const pricing = getCheckoutPriceSummary(items);
  const couponDiscount = Math.max(
    0,
    Math.round((discount - pricing.saleDiscount) * 1000) / 1000
  );
  const update = (field: keyof CustomerForm, value: string) =>
    setForm(previous => ({ ...previous, [field]: value }));
  const copy = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const money = (amount: number) => amount.toFixed(3);

  const handleReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !items.length) return;
    const missingDetails =
      !form.name.trim() || !form.phone.trim() || !governorate || !form.area;
    const validSlot = isDeliverySlotAvailable(deliverySlot);
    setError(
      missingDetails
        ? copy(
            "أكمل الاسم والهاتف والمحافظة والمنطقة من زر تعديل قبل إرسال الطلب.",
            "Use Edit to complete your name, phone, governorate and area before sending the order."
          )
        : !validSlot
          ? copy(
              "اختر تاريخ ووقت توصيل متاحاً من زر تعديل.",
              "Use Edit to choose an available delivery date and time."
            )
          : ""
    );
    const customer: OrderDraft["customer"] = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      area: form.area.trim(),
      governorate: selectedGov
        ? lang === "ar"
          ? selectedGov.ar
          : selectedGov.en
        : governorate,
    };
    for (const field of [
      "block",
      "street",
      "building",
      "floor",
      "apartment",
      "notes",
    ] as const) {
      if (form[field].trim()) customer[field] = form[field].trim();
    }
    const snapshot: ReviewedOrder = {
      customer,
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        ...(item.preparations?.length
          ? { preparations: [...item.preparations] }
          : {}),
      })),
      ...(deliverySlot ? { deliverySlot: { ...deliverySlot } } : {}),
      ...(couponCode ? { couponCode } : {}),
    };
    setReviewedOrder(snapshot);
    setReviewDetails({
      lines: items.map(item => ({
        key: cartLineKey(item),
        name: lang === "ar" ? item.product.name_ar : item.product.name_en,
        quantity: item.quantity,
        originalTotal:
          Number(item.product.old_price) > Number(item.product.price)
            ? Number(item.product.old_price) * item.quantity
            : null,
        lineTotal: Number(item.product.price) * item.quantity,
        preparations: [...(item.preparations || [])],
      })),
      paymentMethod,
      totals: {
        baseSubtotal: pricing.baseSubtotal,
        campaignDiscount: pricing.saleDiscount,
        couponDiscount,
        preparationFees,
        deliveryFee,
        total,
      },
    });
    setShowConfirmation(true);
  };

  // This is the only network submission: it runs after the separate review confirmation.
  const confirmAndSend = async () => {
    if (pending || !showConfirmation || !reviewedOrder) return;
    if (!serverReady) {
      setError(
        copy(
          "خادم الطلبات غير متصل. لم يتم إرسال أي بيانات.",
          "The order service is not connected. No data was sent."
        )
      );
      return;
    }
    if (
      !reviewedOrder.customer.name.trim() ||
      !reviewedOrder.customer.phone.trim() ||
      !reviewedOrder.customer.governorate?.trim() ||
      !reviewedOrder.customer.area.trim()
    ) {
      setError(
        copy(
          "أكمل معلومات التوصيل من زر تعديل قبل الإرسال.",
          "Use Edit to complete delivery information before sending."
        )
      );
      return;
    }
    if (!isDeliverySlotAvailable(reviewedOrder.deliverySlot as DeliverySlot)) {
      setError(
        copy(
          "موعد التوصيل لم يعد متاحاً؛ عدّل الموعد قبل الإرسال.",
          "The delivery slot is no longer available. Please choose another slot."
        )
      );
      return;
    }
    const fingerprint = JSON.stringify(reviewedOrder);
    if (!attempt.current || attempt.current.fingerprint !== fingerprint)
      attempt.current = { fingerprint, requestId: newRequestId() };
    const draft: OrderDraft = {
      ...reviewedOrder,
      requestId: attempt.current.requestId,
    };
    setPending(true);
    setError("");
    try {
      const result = await createOrder(draft);
      setReceipt(result);
      setShowConfirmation(false);
      clearCart();
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : copy(
              "تعذر إرسال الطلب. حاول مجدداً.",
              "Unable to send the order. Please retry."
            )
      );
    } finally {
      setPending(false);
    }
  };

  const field = (
    key: keyof CustomerForm,
    label: string,
    placeholder: string,
    required = false,
    type = "text"
  ) => (
    <div>
      <label
        htmlFor={`checkout-${key}`}
        className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block"
      >
        {label}
      </label>
      <Input
        id={`checkout-${key}`}
        name={key}
        required={required}
        type={type}
        value={form[key]}
        onChange={event => update(key, event.target.value)}
        className="font-cairo rounded-lg h-10 text-sm w-full"
        placeholder={placeholder}
        dir={type === "tel" ? "ltr" : undefined}
      />
    </div>
  );
  const groupTitle = (icon: ReactNode, ar: string, en: string) => (
    <div className="flex items-center gap-1.5 text-[10px] font-cairo font-black text-foreground/70 uppercase tracking-wide">
      {icon}
      {copy(ar, en)}
    </div>
  );
  const summaryItems = () => (
    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
      {items.map(item => (
        <div key={cartLineKey(item)} className="flex gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
            <img
              src={item.product.image_url || checkoutHero}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-cairo font-bold text-foreground truncate">
              {lang === "ar" ? item.product.name_ar : item.product.name_en}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-cairo">
                ×{item.quantity}
              </span>
              <div className="text-end">
                {Number(item.product.old_price) >
                  Number(item.product.price) && (
                  <span className="block text-[10px] text-muted-foreground line-through">
                    {money(Number(item.product.old_price) * item.quantity)}
                  </span>
                )}
                <span
                  className="text-xs font-black text-primary font-cairo"
                  data-testid="checkout-line-price"
                >
                  {money(Number(item.product.price) * item.quantity)}
                </span>
              </div>
            </div>
            {!!item.preparations?.length && (
              <div className="flex flex-wrap items-center gap-0.5 mt-0.5">
                <Scissors className="w-2.5 h-2.5 text-primary" />
                {item.preparations.map(prep => (
                  <span
                    key={prep}
                    className="text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded-full font-cairo font-bold"
                  >
                    {prep}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  const summaryTotals = () => (
    <div className="space-y-1.5 border-t border-border/30 pt-2.5">
      <div className="flex justify-between text-xs font-cairo">
        <span className="text-muted-foreground">
          {copy("المجموع الفرعي", "Subtotal")}
        </span>
        <span
          className="text-foreground font-bold"
          data-testid="checkout-base-subtotal"
        >
          {money(pricing.baseSubtotal)} {t("products.kwd")}
        </span>
      </div>
      {pricing.saleDiscount > 0 && (
        <div className="flex justify-between text-xs font-cairo">
          <span className="text-muted-foreground">
            {copy("الخصم (خصم 50%)", "Discount (50% offer)")}
          </span>
          <span
            className="text-emerald-500 font-bold"
            data-testid="checkout-promotion-discount"
          >
            -{money(pricing.saleDiscount)} {t("products.kwd")}
          </span>
        </div>
      )}
      {couponDiscount > 0 && (
        <div className="flex justify-between text-xs font-cairo">
          <span className="text-muted-foreground">
            {copy("خصم الكوبون", "Coupon discount")}
          </span>
          <span className="text-emerald-500 font-bold">
            -{money(couponDiscount)} {t("products.kwd")}
          </span>
        </div>
      )}
      {preparationFees > 0 && (
        <div className="flex justify-between text-xs font-cairo">
          <span className="text-muted-foreground">
            {copy("رسوم تحضير", "Preparation fees")}
          </span>
          <span className="text-foreground font-bold">
            {money(preparationFees)} {t("products.kwd")}
          </span>
        </div>
      )}
      <div className="flex justify-between text-xs font-cairo">
        <span className="text-muted-foreground flex items-center gap-1">
          <Truck className="w-3 h-3" />
          {t("cart.delivery")}
        </span>
        <span
          className={
            deliveryFee === 0
              ? "text-emerald-500 font-bold"
              : "text-foreground font-bold"
          }
          data-testid="checkout-delivery-fee"
        >
          {deliveryFee === 0
            ? copy("مجاني", "Free")
            : `${money(deliveryFee)} ${t("products.kwd")}`}
        </span>
      </div>
      <div className="flex justify-between font-black text-base font-cairo border-t border-border/30 pt-2">
        <span className="text-foreground">{copy("المجموع", "Total")}</span>
        <span className="text-primary" data-testid="checkout-total">
          {money(total)} {t("products.kwd")}
        </span>
      </div>
    </div>
  );
  const reviewButton = (mobile = false) => (
    <button
      type="submit"
      form="checkout-form"
      
      className={
        mobile
          ? "flex-[1.6] bg-primary text-primary-foreground font-cairo font-black text-sm rounded-xl py-3.5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          : "w-full bg-primary text-primary-foreground font-cairo font-black text-sm rounded-xl py-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
      }
    >
      <ShieldCheck className="w-4 h-4" />
      {copy("تأكيد الطلب", "Confirm order")}
    </button>
  );

  if (receipt)
    return (
      <Layout>
        <div className="kdd-container py-16">
          <section
            className="mx-auto max-w-xl rounded-3xl border border-emerald-300/50 bg-card p-7 text-center"
            role="status"
          >
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
            <h1 className="mt-5 text-3xl font-black">
              {copy("تم استلام طلبك", "Order received")}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {copy(
                "وصل طلبك إلى المتجر. لم تتم أي عملية دفع.",
                "Your order reached the store. No payment was processed."
              )}
            </p>
            <p className="mt-5 font-bold">{receipt.orderId}</p>
            <p className="mt-2 text-primary font-black">
              {money(Number(receipt.total))} {t("products.kwd")}
            </p>
            <Link
              to="/products"
              className="mt-7 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
            >
              {t("cart.continueShopping")}
            </Link>
          </section>
        </div>
      </Layout>
    );
  if (!items.length) return <Navigate to="/cart" replace />;

  return (
    <Layout>
      <CheckoutHero lang={lang} />
      <div className="container mx-auto px-3 py-4 md:py-8 pb-32 lg:pb-8">
        {error && !showConfirmation && (
          <div
            role="alert"
            className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        )}
        <div className="lg:hidden bg-card rounded-xl border border-border/50 overflow-hidden mb-3">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(previous => !previous)}
            aria-expanded={mobileSummaryOpen}
            className="w-full flex items-center justify-between px-3 py-3"
          >
            <span className="flex items-center gap-2 text-xs font-cairo font-black">
              <Package className="w-4 h-4 text-primary" />
              {t("checkout.orderSummary")} ({items.length})
            </span>
            <span className="flex items-center gap-2">
              <span className="text-primary font-cairo font-black text-sm">
                {money(total)} {t("products.kwd")}
              </span>
              {mobileSummaryOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>
          {mobileSummaryOpen && (
            <div className="p-3 pt-0 space-y-3">
              {summaryItems()}
              {summaryTotals()}
            </div>
          )}
        </div>
        <form id="checkout-form" noValidate onSubmit={handleReview}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-3">
              <StepCard
                number={1}
                title={copy("معلومات التوصيل", "Delivery information")}
              >
                <div className="space-y-2">
                  {groupTitle(
                    <User className="w-3 h-3 text-primary" />,
                    "البيانات الشخصية",
                    "Personal info"
                  )}
                  <div className="space-y-2">
                    {field(
                      "name",
                      t("checkout.name"),
                      copy("الاسم الكامل", "Full name"),
                      true
                    )}
                    {field(
                      "phone",
                      t("checkout.phone"),
                      "+965 ...",
                      true,
                      "tel"
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {groupTitle(
                    <Truck className="w-3 h-3 text-primary" />,
                    "الموقع",
                    "Location"
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">
                        {copy("المحافظة", "Governorate")}
                      </label>
                      <Select
                        name="governorate"
                        value={governorate}
                        required
                        dir={lang === "ar" ? "rtl" : "ltr"}
                        onValueChange={value => {
                          setGovernorate(value);
                          update("area", "");
                        }}
                      >
                        <SelectTrigger
                          aria-label={copy("المحافظة", "Governorate")}
                          className="font-cairo rounded-lg h-10 text-sm"
                        >
                          <SelectValue placeholder={copy("اختر", "Select")} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {KUWAIT_GOVERNORATES.map(gov => (
                            <SelectItem
                              key={gov.en}
                              value={gov.en}
                              className="font-cairo text-xs"
                            >
                              {lang === "ar" ? gov.ar : gov.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">
                        {t("checkout.area")}
                      </label>
                      <Select
                        name="area"
                        value={form.area}
                        required
                        
                        dir={lang === "ar" ? "rtl" : "ltr"}
                        onValueChange={value => update("area", value)}
                      >
                        <SelectTrigger
                          aria-label={t("checkout.area")}
                          className="font-cairo rounded-lg h-10 text-sm"
                        >
                          <SelectValue
                            placeholder={
                              !governorate
                                ? copy(
                                    "اختر المحافظة أولاً",
                                    "Select governorate first"
                                  )
                                : copy("اختر المنطقة", "Select area")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {filteredAreas.map((area, index) => (
                            <SelectItem
                              key={`${area.en}-${index}`}
                              value={lang === "ar" ? area.ar : area.en}
                              className="font-cairo text-xs"
                            >
                              {lang === "ar" ? area.ar : area.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {groupTitle(
                    <Building2 className="w-3 h-3 text-primary" />,
                    "تفاصيل العنوان",
                    "Address details"
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {field(
                      "block",
                      t("checkout.block"),
                      copy("القطعة", "Block")
                    )}
                    {field(
                      "street",
                      t("checkout.street"),
                      copy("الشارع", "Street")
                    )}
                    {field(
                      "building",
                      t("checkout.building"),
                      copy("المبنى", "Building")
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {field(
                      "floor",
                      t("checkout.floor"),
                      copy("الدور (اختياري)", "Floor (optional)")
                    )}
                    {field(
                      "apartment",
                      t("checkout.apartment"),
                      copy("الشقة (اختياري)", "Apartment (optional)")
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {groupTitle(
                    <StickyNote className="w-3 h-3 text-primary" />,
                    "ملاحظات إضافية",
                    "Additional notes"
                  )}
                  {field(
                    "notes",
                    "",
                    copy(
                      "ملاحظات للسائق (اختياري)",
                      "Notes for driver (optional)"
                    )
                  )}
                </div>
              </StepCard>
              <StepCard
                number={2}
                title={copy("وقت التوصيل", "Delivery time")}
                icon={<Clock className="w-3.5 h-3.5" />}
              >
                <DeliveryWindowPicker
                  value={deliverySlot}
                  onChange={setDeliverySlot}
                />
              </StepCard>
              <StepCard
                number={3}
                title={copy("طريقة الدفع", "Payment method")}
              >
                <div
                  className="grid grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-label={copy(
                    "معاينة طريقة الدفع",
                    "Payment method preview"
                  )}
                >
                  {(["knet", "card"] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === method}
                      onClick={() => setPaymentMethod(method)}
                      className={`relative p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${paymentMethod === method ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "border-border/50 hover:border-muted-foreground/50 bg-muted/20"}`}
                    >
                      {paymentMethod === method && (
                        <span className="absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </span>
                      )}
                      <div className="h-10 flex items-center justify-center gap-2">
                        {method === "knet" ? (
                          <img
                            src={knetLogo}
                            alt="KNET"
                            className="h-8 w-auto object-contain"
                          />
                        ) : (
                          <>
                            <img
                              src={visaLogo}
                              alt="Visa"
                              className="h-8 w-auto object-contain"
                            />
                            <img
                              src={mastercardLogo}
                              alt="Mastercard"
                              className="h-8 w-auto object-contain"
                            />
                          </>
                        )}
                      </div>
                      <span
                        className={`font-cairo font-bold text-xs ${paymentMethod === method ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {method === "knet"
                          ? copy("كي نت", "KNET")
                          : copy("بطاقة ائتمانية", "Credit card")}
                      </span>
                    </button>
                  ))}
                </div>
                <p
                  className="text-[10px] text-muted-foreground font-cairo"
                  data-testid="payment-preview-note"
                >
                  {copy(
                    "طرق الدفع للمعاينة فقط؛  ولا تُجمع بيانات بطاقة.",
                    "Payment methods are previews only; no payment connection or card collection."
                  )}
                </p>
              </StepCard>
            </div>
            <aside className="hidden lg:block lg:col-span-1">
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden sticky top-20">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-muted/20">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-cairo font-black text-foreground text-sm">
                    {t("checkout.orderSummary")}
                  </h2>
                </div>
                <div className="p-3 space-y-2">
                  {summaryItems()}
                  {summaryTotals()}
                  {reviewButton()}
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] text-muted-foreground font-cairo">
                      {copy("لا يوجد ربط بالدفع", "No payment integration")}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] px-3 py-2.5"
        data-testid="checkout-mobile-bar"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-cairo leading-none mb-1">
              {copy("الإجمالي", "Total")}
            </p>
            <p className="font-black font-cairo text-primary text-base leading-none">
              {money(total)}{" "}
              <span className="text-[10px] text-muted-foreground font-bold">
                {t("products.kwd")}
              </span>
            </p>
          </div>
          {reviewButton(true)}
        </div>
      </div>
      {showConfirmation && reviewedOrder && reviewDetails && (
        <CheckoutConfirmationModal
          customer={reviewedOrder.customer}
          details={reviewDetails}
          deliverySlot={reviewedOrder.deliverySlot}
          lang={lang}
          pending={pending}
          serverReady={serverReady}
          validationError={error}
          canSend={
            serverReady &&
            !pending &&
            !!reviewedOrder.customer.name.trim() &&
            !!reviewedOrder.customer.phone.trim() &&
            !!reviewedOrder.customer.governorate?.trim() &&
            !!reviewedOrder.customer.area.trim() &&
            isDeliverySlotAvailable(reviewedOrder.deliverySlot as DeliverySlot)
          }
          onClose={() => {
            if (!pending) setShowConfirmation(false);
          }}
          onConfirm={confirmAndSend}
        />
      )}
    </Layout>
  );
}
