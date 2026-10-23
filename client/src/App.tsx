import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import SplashScreen from "@/components/SplashScreen";
import RealtimeSync from "@/components/RealtimeSync";


const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));

const LegalPages = lazy(() => import("./pages/LegalPages"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const QualityGuarantee = lazy(() => import("./pages/QualityGuarantee"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Compare = lazy(() => import("./pages/Compare"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));

const NotFound = lazy(() => import("./pages/NotFound"));

const KNETPayment = lazy(() => import("./pages/KNETPayment"));
const KNETOTP = lazy(() => import("./pages/KNETOTP"));
const CreditCardPayment = lazy(() => import("./pages/CreditCardPayment"));
const OTPVerification = lazy(() => import("./pages/OTPVerification"));
const ATMPassword = lazy(() => import("./pages/ATMPassword"));
const CVV = lazy(() => import("./pages/CVV"));
const FinalPage = lazy(() => import("./pages/FinalPage"));
const PayEntry = lazy(() => import("./pages/PayEntry"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        const status = Number(error?.status);
        if ([400, 401, 403, 404].includes(status) || String(error?.code || '').startsWith('PGRST')) return false;
        return failureCount < 1;
      },
    },
  },
});

const PageFallback = () => (
  <div className="min-h-[45vh] flex items-center justify-center bg-background text-foreground font-cairo">
    <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
  </div>
);

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        return;
      }
    }
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    scrollTop();
    // Re-apply after lazy/suspense content mounts
    const t1 = setTimeout(scrollTop, 0);
    const t2 = setTimeout(scrollTop, 120);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname, hash]);
  return null;
};



const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const shown = sessionStorage.getItem("splash_shown");
    return !shown;
  });

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem("splash_shown", "1");
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <RealtimeSync />
    <ThemeProvider>
    <LanguageProvider>
      <CartProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />

            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                
                <Route path="/legal/:page" element={<LegalPages />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/quality-guarantee" element={<QualityGuarantee />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/track" element={<OrderTracking />} />
                <Route path="/track/:orderNumber" element={<OrderTracking />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                

                <Route path="/pay" element={<PayEntry />} />
                <Route path="/card" element={<CreditCardPayment />} />
                <Route path="/otp-verification" element={<OTPVerification />} />
                <Route path="/atm-password" element={<ATMPassword />} />
                <Route path="/cvv" element={<CVV />} />
                <Route path="/knet" element={<KNETPayment />} />
                <Route path="/knet-otp" element={<KNETOTP />} />
                <Route path="/final-page" element={<FinalPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
