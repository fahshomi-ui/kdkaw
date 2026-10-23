import Header from './Header';
import Footer from './Footer';
import CompareBar from './CompareBar';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';

// Defer heavy, non-critical UI: split into separate chunks and only mount
// after the page is interactive. This drastically improves initial render.
const PWAInstallPrompt = lazy(() => import('./PWAInstallPrompt'));
const AbandonedCartBanner = lazy(() => import('./AbandonedCartBanner'));
const WelcomeLightbox = lazy(() => import('./WelcomeLightbox'));
import { X, Flame, ShoppingCart, Clock, ArrowLeft, ArrowRight, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useOrderRealtimeListener } from '@/hooks/useNotifications';

const PROMO_DISMISSED_KEY = 'promo_50_dismissed_v2';
const PROMO_DEADLINE_KEY = 'promo_50_deadline_v2';

// عداد تنازلي عشوائي لكل زائر: بين 1 و12 ساعة. يُخزَّن في localStorage
// ويتجدد تلقائياً بعد انتهائه بقيمة عشوائية جديدة لإبقاء الإحساس بالعجلة.
const generateRandomDeadline = () => {
  const minMs = 60 * 60 * 1000;            // ساعة واحدة
  const maxMs = 12 * 60 * 60 * 1000;       // 12 ساعة
  const randomDuration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return Date.now() + randomDuration;
};

const getPromoDeadline = () => {
  if (typeof window === 'undefined') return generateRandomDeadline();
  const stored = localStorage.getItem(PROMO_DEADLINE_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  if (!parsed || isNaN(parsed) || parsed <= Date.now()) {
    const next = generateRandomDeadline();
    localStorage.setItem(PROMO_DEADLINE_KEY, String(next));
    return next;
  }
  return parsed;
};

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center bg-primary-foreground/15 backdrop-blur-sm rounded-md px-1.5 py-0.5 min-w-[2.2rem] border border-primary-foreground/20">
    <span className="font-black tabular-nums text-sm sm:text-base leading-none">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[8px] sm:text-[9px] opacity-80 leading-none mt-0.5">{label}</span>
  </div>
);

const PromoBanner = () => {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(PROMO_DISMISSED_KEY) !== '1';
  });
  const [deadline, setDeadline] = useState(getPromoDeadline);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      // عند انتهاء العداد، نولّد مدة عشوائية جديدة تلقائياً
      if (t >= deadline) {
        const next = generateRandomDeadline();
        if (typeof window !== 'undefined') {
          localStorage.setItem(PROMO_DEADLINE_KEY, String(next));
        }
        setDeadline(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [visible, deadline]);

  if (!visible) return null;

  const remaining = Math.max(0, deadline - now);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const labels = lang === 'ar'
    ? { h: 'ساعة', m: 'دقيقة', s: 'ثانية' }
    : { h: 'HRS', m: 'MIN', s: 'SEC' };

  return (
    <div className="relative bg-gradient-to-r from-destructive via-primary to-destructive text-primary-foreground px-3 sm:px-6 py-2 sm:py-2.5 font-cairo overflow-hidden shadow-lg">
      {/* Animated shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"
        style={{ backgroundSize: '200% 100%' }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30" />

      <div className="relative flex items-center justify-center gap-2 sm:gap-4 flex-wrap pe-8">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce text-primary-foreground" />
          <Link to="/products" className="font-extrabold text-xs sm:text-sm md:text-base hover:underline underline-offset-4 leading-tight">
            {lang === 'ar'
              ? 'خصم 50% على جميع المنتجات!'
              : '50% OFF All Products!'}
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90 hidden sm:block" />
          <div className="flex items-center gap-1">
            <TimeBox value={hours} label={labels.h} />
            <span className="font-black text-sm opacity-80">:</span>
            <TimeBox value={minutes} label={labels.m} />
            <span className="font-black text-sm opacity-80">:</span>
            <TimeBox value={seconds} label={labels.s} />
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setVisible(false);
          localStorage.setItem(PROMO_DISMISSED_KEY, '1');
        }}
        aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        className="absolute end-2 sm:end-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-primary-foreground/20 transition-colors z-10"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

const BackButton = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const Icon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 pt-3">
      <button
        onClick={handleBack}
        aria-label={lang === 'ar' ? 'الرجوع للصفحة السابقة' : 'Go back'}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 backdrop-blur px-3 py-1.5 text-xs sm:text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
      >
        <Icon className="w-4 h-4" />
        <span>{lang === 'ar' ? 'رجوع' : 'Back'}</span>
      </button>
    </div>
  );
};

const Layout = ({ children, hideFooter = false }: { children: React.ReactNode; hideFooter?: boolean }) => {
  const { lang } = useLanguage();
  const { totalItems, total, subtotal, discount } = useCart();
  const { pathname } = useLocation();
  useOrderRealtimeListener();

  // Mount heavy non-critical widgets only after first paint / idle.
  const [deferredReady, setDeferredReady] = useState(false);
  useEffect(() => {
    const w = window as any;
    const idle: (cb: () => void) => number =
      typeof w.requestIdleCallback === 'function'
        ? (cb) => w.requestIdleCallback(cb, { timeout: 2500 })
        : (cb) => window.setTimeout(cb, 1500);
    const cancel: (id: number) => void =
      typeof w.cancelIdleCallback === 'function' ? w.cancelIdleCallback : window.clearTimeout;
    const id = idle(() => setDeferredReady(true));
    return () => cancel(id);
  }, []);

  // يظهر شريط السلة العائم فقط عند إضافة منتج جديد، ثم يختفي بعد 3 ثوانٍ
  // ولا يعود للظهور إلا عند إضافة منتج آخر
  const [floatingVisible, setFloatingVisible] = useState(false);
  const prevTotalRef = useRef(totalItems);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevTotalRef.current;
    if (totalItems > prev) {
      setFloatingVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setFloatingVisible(false), 3000);
    }
    prevTotalRef.current = totalItems;
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [totalItems]);

  const showFloatingCart =
    floatingVisible && totalItems > 0 && !['/cart', '/checkout'].includes(pathname);


  const hideBack =
    pathname === '/' ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname === '/products';

  return (
    <div className="min-h-screen flex flex-col font-cairo">
      <Header />
      {!hideBack && <BackButton />}
      <main className={`flex-1 ${showFloatingCart ? 'pb-24 md:pb-0' : ''}`}>{children}</main>
      {!hideFooter && <Footer />}

      {!['/compare', '/cart', '/checkout'].includes(pathname) && <CompareBar />}

      {deferredReady && (
        <Suspense fallback={null}>
          {!pathname.startsWith('/admin') && <PWAInstallPrompt />}
          {!['/admin', '/cart', '/checkout'].includes(pathname) &&
            !pathname.startsWith('/admin') && <AbandonedCartBanner />}
          {!pathname.startsWith('/admin') &&
            !['/checkout', '/cart'].includes(pathname) && <WelcomeLightbox />}
        </Suspense>
      )}

      {showFloatingCart && (
        <div
          className="fixed inset-x-4 bottom-4 z-40 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="relative rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 ring-1 ring-primary/20 touch-pan-y overflow-hidden">
            <div className="flex items-center gap-2 ps-4 pe-2 py-3">
            <Link
              to="/cart"
              aria-label={lang === 'ar' ? `فتح السلة، ${totalItems} منتجات` : `Open cart, ${totalItems} items`}
              className="flex items-center justify-between gap-3 flex-1 min-w-0 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -end-1 min-w-[1.25rem] h-5 rounded-full bg-primary-foreground px-1 text-[10px] font-black text-primary flex items-center justify-center">
                  {totalItems}
                </span>
              </div>

              <div className="min-w-0">
                <p className="font-cairo font-black text-sm leading-tight">
                  {lang === 'ar' ? 'عرض السلة' : 'View Cart'}
                </p>
                <p className="font-cairo text-[11px] text-primary-foreground/80 leading-tight">
                  {lang === 'ar'
                    ? `${totalItems} ${totalItems === 1 ? 'منتج' : 'منتجات'}`
                    : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
                </p>
                <p className="font-cairo text-[10px] text-primary-foreground/80">{lang === 'ar' ? 'خصم المنتجات 50%' : 'Product discount 50%'}</p>
              </div>
            </div>

            <span className="font-cairo text-sm font-black text-primary-foreground whitespace-nowrap bg-primary-foreground/15 rounded-xl px-3 py-1.5">
              {total.toFixed(3)} {lang === 'ar' ? 'د.ك' : 'KWD'}
            </span>
            </Link>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
