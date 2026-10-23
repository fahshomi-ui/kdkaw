import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Language = "ar" | "en";

type LanguageContextValue = {
  lang: Language;
  dir: "rtl" | "ltr";
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const translations: Record<string, Record<Language, string>> = {
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.products": { ar: "المنتجات", en: "Products" },
  "nav.cart": { ar: "السلة", en: "Cart" },
  "hero.title": {
    ar: "ألبان وعصائر وآيس كريم منذ 1962",
    en: "Dairy, juices and ice cream since 1962",
  },
  "hero.subtitle": {
    ar: "منتجات كي دي دي إلى بابك في كل مناطق الكويت",
    en: "KDD favourites delivered across Kuwait",
  },
  "hero.cta": { ar: "تسوّق الآن", en: "Shop now" },
  "products.title": { ar: "منتجاتنا", en: "Our products" },
  "products.all": { ar: "كل المنتجات", en: "All products" },
  "products.addToCart": { ar: "أضف للسلة", en: "Add to cart" },
  "products.kwd": { ar: "د.ك", en: "KWD" },
  "products.outOfStock": {
    ar: "غير متوفر حالياً",
    en: "Currently unavailable",
  },
  "products.quantity": { ar: "الكمية", en: "Quantity" },
  "products.search": { ar: "ابحث عن منتج...", en: "Search products..." },
  "products.relatedProducts": { ar: "منتجات مشابهة", en: "Related products" },
  "cart.empty": { ar: "سلتك فارغة", en: "Your cart is empty" },
  "cart.continueShopping": { ar: "متابعة التسوق", en: "Continue shopping" },
  "cart.subtotal": { ar: "المجموع الفرعي", en: "Subtotal" },
  "cart.delivery": { ar: "التوصيل", en: "Delivery" },
  "cart.free": { ar: "مجاني", en: "Free" },
  "cart.discount": { ar: "الخصم", en: "Discount" },
  "cart.total": { ar: "الإجمالي", en: "Total" },
  "cart.checkout": { ar: "متابعة لإرسال الطلب", en: "Continue to send order" },
  "cart.coupon": { ar: "رمز الخصم", en: "Coupon code" },
  "cart.applyCoupon": { ar: "تطبيق", en: "Apply" },
  "checkout.deliveryInfo": { ar: "بيانات التوصيل", en: "Delivery details" },
  "checkout.name": { ar: "الاسم الكامل", en: "Full name" },
  "checkout.phone": { ar: "رقم الهاتف", en: "Phone number" },
  "checkout.area": { ar: "المنطقة", en: "Area" },
  "checkout.block": { ar: "القطعة", en: "Block" },
  "checkout.street": { ar: "الشارع", en: "Street" },
  "checkout.building": { ar: "المبنى", en: "Building" },
  "checkout.floor": { ar: "الدور", en: "Floor" },
  "checkout.apartment": { ar: "الشقة", en: "Apartment" },
  "checkout.notes": { ar: "ملاحظات", en: "Notes" },
  "checkout.orderSummary": { ar: "ملخص الطلب", en: "Order summary" },
  "footer.about": { ar: "عن كي دي دي", en: "About KDD" },
  "footer.links": { ar: "روابط سريعة", en: "Quick links" },
  "footer.contact": { ar: "تواصل معنا", en: "Contact us" },
  "general.loading": { ar: "جاري التحميل...", en: "Loading..." },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);
const LANGUAGE_KEY = "kdd-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === "undefined") return "ar";
    return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ar";
  });
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [dir, lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir,
      setLang,
      t: (key: string) => translations[key]?.[lang] ?? key,
    }),
    [dir, lang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export type { Language };
