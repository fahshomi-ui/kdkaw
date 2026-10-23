import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/kdd/components/Header";
import Footer from "@/kdd/components/Footer";
import { useCart } from "@/kdd/contexts/CartContext";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import ShoppingSessionBanner from "@/kdd/components/ShoppingSessionBanner";

export default function Layout({
  children,
  hideFooter = false,
}: {
  children: ReactNode;
  hideFooter?: boolean;
}) {
  const { lang } = useLanguage();
  const { totalItems, total } = useCart();
  const { pathname } = useLocation();
  const showCartBar =
    totalItems > 0 && pathname !== "/cart" && pathname !== "/checkout";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ShoppingSessionBanner />
      <Header />
      <main className={showCartBar ? "flex-1 pb-24 md:pb-0" : "flex-1"}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      {showCartBar && (
        <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
          <Link
            to="/cart"
            className="flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-xl"
          >
            <span className="font-bold">
              {lang === "ar"
                ? `عرض السلة (${totalItems})`
                : `View cart (${totalItems})`}
            </span>
            <span className="font-black">
              {total.toFixed(3)} {lang === "ar" ? "د.ك" : "KWD"}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
