import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Clock3,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import knetLogo from "@/kdd/assets/knet-checkout-logo.png";
import mastercardLogo from "@/kdd/assets/mastercard-logo.png";
import visaLogo from "@/kdd/assets/visa-logo.png";
import type { OrderDraft } from "@/kdd/lib/types";

export interface ConfirmationDetails {
  lines: {
    key: string;
    name: string;
    quantity: number;
    originalTotal: number | null;
    lineTotal: number;
    preparations: string[];
  }[];
  paymentMethod: "knet" | "card";
  totals: {
    baseSubtotal: number;
    campaignDiscount: number;
    couponDiscount: number;
    preparationFees: number;
    deliveryFee: number;
    total: number;
  };
}

export interface CheckoutConfirmationModalProps {
  customer: OrderDraft["customer"];
  details: ConfirmationDetails;
  deliverySlot?: OrderDraft["deliverySlot"];
  lang: "ar" | "en";
  pending: boolean;
  canSend: boolean;
  serverReady: boolean;
  validationError: string;
  onClose: () => void;
  onConfirm: () => void;
}

const money = (amount: number, lang: "ar" | "en") =>
  `${amount.toFixed(3)} ${lang === "ar" ? "د.ك" : "KWD"}`;

const hasValue = (value?: string | null) => Boolean(value && value.trim());

export default function CheckoutConfirmationModal({
  customer,
  details,
  lang,
  pending,
  canSend,
  serverReady,
  validationError,
  onClose,
  onConfirm,
}: CheckoutConfirmationModalProps) {
  const isArabic = lang === "ar";
  const modalRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hasCapturedFocusRef = useRef(false);
  const latestCloseRef = useRef(onClose);
  const pendingRef = useRef(pending);

  useEffect(() => {
    latestCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (!hasCapturedFocusRef.current) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      hasCapturedFocusRef.current = true;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () => {
      const root = modalRef.current;
      if (!root) return [] as HTMLElement[];

      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(element => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
    };

    const initialFocusable = getFocusableElements();
    const initialFocus =
      closeButtonRef.current && !closeButtonRef.current.disabled
        ? closeButtonRef.current
        : initialFocusable[0];
    initialFocus?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pendingRef.current) latestCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const outsideModal = !modalRef.current?.contains(current);

      if (event.shiftKey && (current === first || outsideModal)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outsideModal)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const previous = previousFocusRef.current;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, []);

  const text = isArabic
    ? {
        title: "تأكيد المعلومات والدفع",
        deliveryInfo: "معلومات التوصيل",
        name: "الاسم",
        phone: "الهاتف",
        governorate: "المحافظة",
        area: "المنطقة",
        block: "القطعة",
        street: "الشارع",
        building: "المبنى",
        floor: "الدور",
        apartment: "الشقة",
        notes: "ملاحظات",
        deliverySlot: "موعد التوصيل",
        products: "المنتجات",
        payment: "طريقة الدفع",
        knet: "KNET",
        card: "Visa / Mastercard",
        subtotal: "المجموع الفرعي",
        campaignDiscount: "الخصم (خصم 50%)",
        couponDiscount: "خصم الكوبون",
        preparationFees: "رسوم التحضير",
        shipping: "التوصيل",
        free: "مجاني",
        total: "المجموع",
        edit: "تعديل",
        confirm: pending ? "جارٍ إرسال الطلب..." : "تأكيد إرسال الطلب",
        offline: "الخادم غير متصل حالياً؛ حاول مرة أخرى عند عودته.",
        paymentNotice: "؛ .",
        missing: "غير متوفر",
      }
    : {
        title: "Confirm information & payment",
        deliveryInfo: "Delivery information",
        name: "Name",
        phone: "Phone",
        governorate: "Governorate",
        area: "Area",
        block: "Block",
        street: "Street",
        building: "Building",
        floor: "Floor",
        apartment: "Apartment",
        notes: "Notes",
        deliverySlot: "Delivery slot",
        products: "Products",
        payment: "Payment method",
        knet: "KNET",
        card: "Visa / Mastercard",
        subtotal: "Subtotal",
        campaignDiscount: "Discount (50% offer)",
        couponDiscount: "Coupon discount",
        preparationFees: "Preparation fees",
        shipping: "Shipping",
        free: "Free",
        total: "Total",
        edit: "Edit",
        confirm: pending ? "Sending order..." : "Confirm order",
        offline:
          "The server is currently offline; please try again when it is available.",
        paymentNotice:
          "Payment is not connected; no payment will be processed.",
        missing: "Unavailable",
      };

  const requiredRows = [
    [text.name, customer.name],
    [text.phone, customer.phone],
    [text.area, customer.area],
  ] as const;

  const optionalRows = [
    [text.block, customer.block],
    [text.street, customer.street],
    [text.building, customer.building],
    [text.notes, customer.notes],
  ] as const;

  const paymentLogo = details.paymentMethod === "knet" ? knetLogo : visaLogo;

  const modal = (
    <section
      ref={modalRef}
      data-testid="checkout-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-confirm-title"
      dir={isArabic ? "rtl" : "ltr"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={event => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="relative w-full sm:max-w-md">
        <div
          data-testid="confirmation-panel"
          className="bg-card w-full sm:max-w-md rounded-2xl border border-border/50 shadow-2xl max-h-[85vh] overflow-y-auto font-cairo text-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onClick={event => event.stopPropagation()}
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card sticky top-0 z-10 rounded-t-2xl">
            <h2
              id="checkout-confirm-title"
              className="font-cairo font-black text-foreground text-sm flex items-center gap-2"
            >
              <ShieldCheck
                className="w-4 h-4 text-primary"
                aria-hidden="true"
              />
              {text.title}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                if (!pending) onClose();
              }}
              
              aria-label={isArabic ? "إغلاق" : "Close"}
              className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </header>
          <div className="p-4 space-y-3">
            <section
              className="space-y-2"
              aria-labelledby="confirmation-delivery-heading"
            >
              <h3
                id="confirmation-delivery-heading"
                className="text-xs font-cairo font-black text-muted-foreground flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                {text.deliveryInfo}
              </h3>
              <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-xs font-cairo">
                {requiredRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{label}</span>
                    <span
                      className="font-bold text-foreground break-words text-start"
                      dir={label === text.phone ? "ltr" : undefined}
                    >
                      {hasValue(value) ? value : text.missing}
                    </span>
                  </div>
                ))}
                {optionalRows.map(([label, value]) =>
                  hasValue(value) ? (
                    <div key={label} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-bold text-foreground break-words text-start">
                        {value}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            </section>
            <section
              className="space-y-2"
              data-testid="confirmation-products"
              aria-labelledby="confirmation-products-heading"
            >
              <h3
                id="confirmation-products-heading"
                className="text-xs font-cairo font-black text-muted-foreground flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" aria-hidden="true" />
                {text.products} ({details.lines.length})
              </h3>
              <div
                data-testid="confirmation-product-list"
                className="bg-muted/30 rounded-xl p-3 space-y-2 max-h-[120px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor:
                    "hsl(var(--primary) / 0.3) hsl(var(--muted) / 0.5)",
                }}
              >
                {details.lines.map(line => (
                  <div
                    key={line.key}
                    className="flex items-center justify-between text-xs font-cairo gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        {line.name} ×{line.quantity}
                      </p>
                      {line.preparations.length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {line.preparations.join("، ")}
                        </p>
                      )}
                    </div>
                    <div className="font-bold text-primary ms-2 shrink-0 text-start">
                      {line.originalTotal !== null && (
                        <div className="text-[10px] text-muted-foreground font-normal line-through">
                          {line.originalTotal.toFixed(3)}
                        </div>
                      )}
                      <div className="text-xs font-black">
                        {line.lineTotal.toFixed(3)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section
              className="space-y-2"
              data-testid="confirmation-payment"
              aria-labelledby="confirmation-payment-heading"
            >
              <h3
                id="confirmation-payment-heading"
                className="text-xs font-cairo font-black text-muted-foreground flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                {text.payment}
              </h3>
              <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <img
                    src={paymentLogo}
                    alt={details.paymentMethod === "knet" ? "KNET" : "Visa"}
                    className="h-6 w-auto object-contain"
                  />
                  {details.paymentMethod === "card" && (
                    <img
                      src={mastercardLogo}
                      alt="Mastercard"
                      className="h-6 w-auto object-contain"
                    />
                  )}
                </div>
                <span className="text-xs font-cairo font-bold text-foreground">
                  {details.paymentMethod === "knet" ? text.knet : text.card}
                </span>
              </div>
            </section>
            <section
              aria-label={isArabic ? "ملخص الطلب" : "Order summary"}
              className="border-t border-border/30 pt-3 space-y-1"
            >
              <div
                data-testid="confirmation-subtotal"
                className="flex justify-between text-xs font-cairo"
              >
                <span className="text-muted-foreground">{text.subtotal}</span>
                <span className="font-bold text-foreground">
                  {money(details.totals.baseSubtotal, lang)}
                </span>
              </div>
              {details.totals.campaignDiscount > 0 && (
                <div
                  data-testid="confirmation-discount"
                  className="flex justify-between text-xs font-cairo"
                >
                  <span className="text-muted-foreground">
                    {text.campaignDiscount}
                  </span>
                  <span className="font-bold text-emerald-500">
                    -{money(details.totals.campaignDiscount, lang)}
                  </span>
                </div>
              )}
              {details.totals.couponDiscount > 0 && (
                <div className="flex justify-between text-xs font-cairo">
                  <span className="text-muted-foreground">
                    {text.couponDiscount}
                  </span>
                  <span className="font-bold text-emerald-500">
                    -{money(details.totals.couponDiscount, lang)}
                  </span>
                </div>
              )}
              {details.totals.preparationFees > 0 && (
                <div className="flex justify-between text-xs font-cairo">
                  <span className="text-muted-foreground">
                    {text.preparationFees}
                  </span>
                  <span className="font-bold text-foreground">
                    {money(details.totals.preparationFees, lang)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs font-cairo">
                <span className="text-muted-foreground">{text.shipping}</span>
                <span
                  className={
                    details.totals.deliveryFee === 0
                      ? "font-bold text-emerald-500 flex items-center gap-1"
                      : "font-bold text-foreground"
                  }
                >
                  {details.totals.deliveryFee === 0 ? (
                    <>
                      {text.free}
                      <Sparkles
                        className="w-3 h-3 text-amber-500"
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    money(details.totals.deliveryFee, lang)
                  )}
                </span>
              </div>
              <div
                data-testid="confirmation-total"
                className="flex justify-between font-black text-base font-cairo border-t border-border/30 pt-2"
              >
                <span className="text-foreground">{text.total}</span>
                <span className="text-primary">
                  {money(details.totals.total, lang)}
                </span>
              </div>
            </section>
            {validationError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/5 p-2 text-xs font-cairo text-destructive"
              >
                {validationError}
              </p>
            )}
            <footer className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!pending) onClose();
                }}
                
                className="flex-1 bg-muted/50 text-muted-foreground font-cairo font-bold text-sm rounded-xl py-3 border border-border/30 hover:bg-muted/70 disabled:cursor-not-allowed"
              >
                {text.edit}
              </button>
              <button
                type="button"
                data-testid="checkout-confirm-send"
                onClick={onConfirm}
                
                className="flex-[2] bg-primary text-primary-foreground font-cairo font-black text-sm rounded-xl py-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                {text.confirm}
              </button>
            </footer>
          </div>
        </div>
        <p
          aria-live="polite"
          className="absolute top-full left-0 right-0 mt-1 text-[10px] leading-relaxed font-cairo text-white/90 text-center"
        >
          {text.paymentNotice}
          {!serverReady && <> {text.offline}</>}
        </p>
      </div>
    </section>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

export { CheckoutConfirmationModal };
