import { useEffect, useState } from "react";
import { Clock, Flame, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import {
  getSessionCountdown,
  loadShoppingSession,
  type SessionStorage,
} from "@/kdd/lib/shoppingSession";

const DISMISSED_KEY = "kdd-shopping-session-banner-hidden-v1";

function browserStorage(): SessionStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function initiallyVisible() {
  try {
    return browserStorage()?.getItem(DISMISSED_KEY) !== "1";
  } catch {
    return true;
  }
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[2.2rem] flex-col items-center rounded-md border border-primary-foreground/20 bg-primary-foreground/15 px-1.5 py-0.5 backdrop-blur-sm">
      <span className="text-sm font-black tabular-nums leading-none sm:text-base">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[8px] leading-none opacity-80 sm:text-[9px]">
        {label}
      </span>
    </div>
  );
}

export default function ShoppingSessionBanner() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(initiallyVisible);
  const [session] = useState(() => loadShoppingSession(browserStorage()));
  const [now, setNow] = useState(() => Date.now());
  const countdown = getSessionCountdown(session, now);
  const expired = countdown.remainingSeconds === 0;

  useEffect(() => {
    if (!visible || expired) return;
    const update = () => setNow(previous => Math.max(previous, Date.now()));
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pageshow", update);
    };
  }, [visible, expired]);

  if (!visible) return null;
  const labels =
    lang === "ar"
      ? {
          session: "جلسة التسوق",
          hours: "ساعة",
          minutes: "دقيقة",
          seconds: "ثانية",
        }
      : {
          session: "Shopping session",
          hours: "HRS",
          minutes: "MIN",
          seconds: "SEC",
        };

  return (
    <div className="kdd-promo-banner" data-testid="kdd-shopping-session-banner">
      <div className="kdd-promo-shimmer" aria-hidden="true" />
      <div className="kdd-promo-pattern" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-center gap-2 pe-8 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Flame
            className="kdd-promo-flame h-4 w-4 text-primary-foreground sm:h-5 sm:w-5"
            aria-hidden="true"
          />
          <Link
            to="/products"
            className="text-xs font-extrabold leading-tight underline-offset-4 hover:underline sm:text-sm md:text-base"
          >
            {lang === "ar"
              ? "خصم 50% على جميع المنتجات!"
              : "50% OFF All Products!"}
          </Link>
        </div>
        <div
          className="flex items-center gap-1.5"
          role="timer"
          aria-label={
            lang === "ar"
              ? "الوقت المتبقي لجلسة التسوق"
              : "Shopping session time remaining"
          }
          aria-live="off"
          data-testid="kdd-shopping-session-countdown"
        >
          <span className="flex max-w-[3.5rem] items-center gap-1 text-[9px] leading-tight opacity-90">
            <Clock
              className="hidden h-3.5 w-3.5 shrink-0 sm:block sm:h-4 sm:w-4"
              aria-hidden="true"
            />
            {labels.session}
          </span>
          <div
            className="flex items-center gap-1"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <TimeBox value={countdown.hours} label={labels.hours} />
            <span className="text-sm font-black opacity-80" aria-hidden="true">
              :
            </span>
            <TimeBox value={countdown.minutes} label={labels.minutes} />
            <span className="text-sm font-black opacity-80" aria-hidden="true">
              :
            </span>
            <TimeBox value={countdown.seconds} label={labels.seconds} />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          try {
            browserStorage()?.setItem(DISMISSED_KEY, "1");
          } catch {
            // Closing still works when optional browser storage is unavailable.
          }
        }}
        aria-label={lang === "ar" ? "إغلاق" : "Close"}
        className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-primary-foreground/20 sm:end-3"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}
