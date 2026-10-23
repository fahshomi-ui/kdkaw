import { useEffect, useState } from 'react';
import { X, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const DISMISS_KEY = 'welcome_lightbox_dismissed_v1';

const WelcomeLightbox = () => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-lightbox-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 bg-gradient-to-br from-[#fff5f5] via-white to-white border border-red-100">
        {/* Decorative top wave */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-br from-[#E11D2A] to-[#ff4757] rounded-b-[40%]" />

        {/* Sparkle decorations */}
        <Sparkles className="absolute top-4 left-4 w-5 h-5 text-white/40 animate-pulse" />
        <Sparkles className="absolute top-6 right-8 w-3 h-3 text-white/30 animate-pulse delay-150" />
        <Sparkles className="absolute top-12 left-8 w-2.5 h-2.5 text-white/25 animate-pulse delay-300" />

        {/* Close button */}
        <button
          type="button"
          onClick={close}
          aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
          className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative pt-20 pb-7 px-7 text-center">
          {/* 50% Badge */}
          <div className="relative mx-auto w-28 h-28 -mt-3 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] shadow-lg shadow-amber-200 flex flex-col items-center justify-center">
              <div className="text-white leading-none text-center">
                <span className="block font-black text-2xl tabular-nums">50%</span>
                <span className="block font-cairo font-bold text-[10px] opacity-95">
                  {lang === 'ar' ? 'خصم' : 'OFF'}
                </span>
                <span className="block font-cairo font-bold text-[9px] opacity-90 mt-0.5">
                  {lang === 'ar' ? 'لفترة محدودة' : 'Limited Time'}
                </span>
              </div>
            </div>
            {/* Ring pulse */}
            <div className="absolute inset-[-4px] rounded-full border-2 border-amber-400/30 animate-ping" style={{ animationDuration: '2.5s' }} />
          </div>

          {/* Brand */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <ShoppingBag className="w-4 h-4 text-[#E11D2A]" />
            <span className="font-cairo font-bold text-sm text-[#E11D2A]">KDCow</span>
          </div>

          {/* Title */}
          <h2
            id="welcome-lightbox-title"
            className="font-cairo font-bold text-xl text-foreground mb-1.5 leading-tight"
          >
            {lang === 'ar' ? 'خصم 50% على جميع المنتجات' : '50% OFF On All Products'}
          </h2>

          {/* Subtitle */}
          <p className="font-cairo text-sm text-muted-foreground mb-6">
            {lang === 'ar'
              ? 'يطبّق تلقائياً عند إتمام الطلب — لفترة محدودة'
              : 'Auto-applied at checkout — limited time'}
          </p>

          {/* CTA */}
          <Link
            to="/products"
            onClick={close}
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-[#E11D2A] to-[#ff4757] text-white font-cairo font-bold text-sm rounded-2xl py-3.5 shadow-lg shadow-red-200 hover:shadow-red-300 hover:brightness-105 active:scale-[0.97] transition-all duration-200"
          >
            <ShoppingBag className="w-4 h-4 me-2" />
            {lang === 'ar' ? 'تسوّق الآن واستفد' : 'Shop Now & Save'}
          </Link>

        </div>
      </div>
    </div>
  );
};

export default WelcomeLightbox;
