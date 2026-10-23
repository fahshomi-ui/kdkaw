import { useState } from 'react';
import { ShoppingCart, X, Sparkles } from 'lucide-react';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const AbandonedCartBanner = () => {
  const { lang } = useLanguage();
  const { recoverable, dismiss, restore } = useAbandonedCart();
  const [restoring, setRestoring] = useState(false);

  if (!recoverable) return null;

  const itemCount = recoverable.items.reduce((s, i) => s + i.quantity, 0);

  const handleRestore = async () => {
    setRestoring(true);
    await restore();
    setRestoring(false);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm z-40 animate-in slide-in-from-bottom-5 fade-in">
      <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-md">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <h4 className="font-cairo font-bold text-sm">
                {lang === 'ar' ? 'سلتك تنتظرك!' : 'Your cart is waiting!'}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground font-cairo mb-3">
              {lang === 'ar'
                ? `لديك ${itemCount} منتج بقيمة ${recoverable.total.toFixed(3)} د.ك`
                : `${itemCount} items worth ${recoverable.total.toFixed(3)} KWD`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="font-cairo h-8 text-xs flex-1" onClick={handleRestore} disabled={restoring}>
                {restoring
                  ? lang === 'ar' ? 'جاري...' : 'Loading...'
                  : lang === 'ar' ? 'استعادة السلة' : 'Restore cart'}
              </Button>
              <Button size="sm" variant="ghost" className="font-cairo h-8 text-xs" onClick={dismiss}>
                {lang === 'ar' ? 'لاحقاً' : 'Later'}
              </Button>
            </div>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AbandonedCartBanner;
