import { Link } from "react-router-dom";
import { useLanguage } from "@/kdd/contexts/LanguageContext";

export function LoadingState() {
  const { t } = useLanguage();
  return <div className="kdd-status animate-pulse">{t("general.loading")}</div>;
}

export function ErrorState({ message }: { message?: unknown }) {
  const { lang } = useLanguage();
  const text =
    message instanceof Error
      ? message.message
      : typeof message === "string"
        ? message
        : "";
  return (
    <div className="kdd-status border-destructive/30 text-destructive">
      <p className="font-bold">
        {lang === "ar"
          ? "تعذر تحميل الكتالوج حالياً."
          : "The catalog could not be loaded."}
      </p>
      {text && <p className="mt-2 text-xs opacity-80">{text}</p>}
    </div>
  );
}

export function EmptyState({ detail = false }: { detail?: boolean }) {
  const { lang } = useLanguage();
  return (
    <div className="kdd-status">
      <p className="font-bold">
        {detail
          ? lang === "ar"
            ? "لا توجد منتجات في هذه الفئة."
            : "No products in this category."
          : lang === "ar"
            ? "لا توجد منتجات متاحة حالياً."
            : "No products are available right now."}
      </p>
      <Link
        className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
        to="/products"
      >
        {lang === "ar" ? "استعراض المنتجات" : "Browse products"}
      </Link>
    </div>
  );
}
