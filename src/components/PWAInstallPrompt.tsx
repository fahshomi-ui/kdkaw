import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

const PWAInstallPrompt = () => {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore Safari
      window.navigator.standalone === true;
    if (standalone) return;

    // Recently dismissed?
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const ageDays = (Date.now() - parseInt(dismissedAt, 10)) / 86_400_000;
      if (ageDays < DISMISS_DAYS) return;
    }

    // iOS detection (no beforeinstallprompt support)
    const ua = window.navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (ios) {
      setIsIOS(true);
      // Show after 6s on iOS
      const t = setTimeout(() => setVisible(true), 6000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
      setDeferred(null);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4 animate-in fade-in" onClick={() => setShowIOSGuide(false)}>
        <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              {isAr ? 'ثبّت التطبيق' : 'Install App'}
            </h3>
            <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">1</span>
              <div>
                {isAr ? 'اضغط على أيقونة المشاركة' : 'Tap the Share icon'}
                <Share2 className="inline w-4 h-4 mx-1 text-blue-500" />
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">2</span>
              <div>{isAr ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"'}</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">3</span>
              <div>{isAr ? 'اضغط "إضافة" في الأعلى' : 'Tap "Add" in the top right'}</div>
            </li>
          </ol>
          <Button className="w-full mt-5" onClick={() => setShowIOSGuide(false)}>
            {isAr ? 'تم' : 'Got it'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <img src="/pwa-icon-192.png" alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate">
            {isAr ? 'ثبّت تطبيق كي دي كاو 📱' : 'Install KDCow App 📱'}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {isAr ? 'وصول أسرع وتجربة أفضل' : 'Faster access & better experience'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" onClick={handleInstall} className="gap-1">
            <Download className="w-3.5 h-3.5" />
            {isAr ? 'تثبيت' : 'Install'}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;