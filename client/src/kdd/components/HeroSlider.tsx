import { useState, useEffect, useCallback } from "react";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { Link } from "react-router-dom";
import heroDairy from "@/kdd/assets/kdd-hero-dairy.jpg";
import heroJuice from "@/kdd/assets/kdd-hero-juice.jpg";
import heroIce from "@/kdd/assets/kdd-hero-icecream.jpg";
import heroCook from "@/kdd/assets/kdd-hero-cooking.jpg";

type Slide = {
  image: string;
  alt: string;
  link: string;
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
  ctaAr: string;
  ctaEn: string;
  /** tailwind position classes for text block */
  align?: "start" | "center" | "end";
};

const slides: Slide[] = [
  {
    image: heroDairy,
    alt: "ألبان كي دي دي الطازجة",
    link: "/category/kdd-dairy",
    titleAr: "نقاوة الحليب الكويتي منذ 1962",
    titleEn: "Pure Kuwaiti Dairy since 1962",
    subAr: "حليب ولبن وأجبان طازجة تصلك كل يوم بنفس الجودة التي تثق بها",
    subEn: "Fresh milk, laban & cheese — the quality you trust, every day",
    ctaAr: "تسوّق الألبان",
    ctaEn: "Shop Dairy",
    align: "start",
  },
  {
    image: heroJuice,
    alt: "عصائر كي دي دي",
    link: "/category/kdd-juices",
    titleAr: "انتعاش طبيعي في كل رشفة",
    titleEn: "Natural Refreshment in Every Sip",
    subAr: "عصائر غنية بالفاكهة لكل أفراد العائلة",
    subEn: "Fruit-rich juices for the whole family",
    ctaAr: "اكتشف العصائر",
    ctaEn: "Discover Juices",
    align: "start",
  },
  {
    image: heroIce,
    alt: "آيس كريم كي دي دي",
    link: "/category/kdd-icecream",
    titleAr: "لحظات حلوة تجمعنا",
    titleEn: "Sweet Moments Together",
    subAr: "آيس كريم كريمي بنكهات لا تُنسى",
    subEn: "Creamy ice cream with unforgettable flavors",
    ctaAr: "تسوّق الآيس كريم",
    ctaEn: "Shop Ice Cream",
    align: "start",
  },
  {
    image: heroCook,
    alt: "منتجات الطهي من كي دي دي",
    link: "/category/kdd-cooking",
    titleAr: "سر الطبخة الأصيلة",
    titleEn: "The Secret of Authentic Cooking",
    subAr: "كريمة وزبدة وسمن لأطباق بطعم البيت",
    subEn: "Cream, butter & ghee for home-made taste",
    ctaAr: "منتجات الطهي",
    ctaEn: "Cooking Range",
    align: "start",
  },
];

const HeroSlider = () => {
  const { lang } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(
    slides.map((_, i) => i === 0)
  );
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoved = useRef(false);

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(idx);
      setTimeout(() => setIsTransitioning(false), 900);
    },
    [isTransitioning]
  );

  const next = useCallback(
    () => goTo((current + 1) % slides.length),
    [current, goTo]
  );
  const prev = useCallback(
    () => goTo((current - 1 + slides.length) % slides.length),
    [current, goTo]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchMoved.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      touchMoved.current = true;
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    touchStartY.current = null;
    const threshold = 40;
    if (Math.abs(dx) < threshold) return;
    // Swipe left → next, swipe right → prev (mirror in RTL)
    if (dx < 0) {
      lang === "ar" ? prev() : next();
    } else {
      lang === "ar" ? next() : prev();
    }
  };

  // Preload next image
  useEffect(() => {
    const nextIdx = (current + 1) % slides.length;
    if (!imageLoaded[nextIdx]) {
      const img = new Image();
      img.src = slides[nextIdx].image;
      img.onload = () =>
        setImageLoaded(prev => {
          const n = [...prev];
          n[nextIdx] = true;
          return n;
        });
    }
  }, [current]);

  return (
    <div
      className="relative w-full overflow-hidden bg-muted h-[58vh] sm:h-[72vh] md:h-[85vh] lg:h-[90vh] min-h-[440px] max-h-[1000px] touch-pan-y select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides — full image, clickable to category */}
      {slides.map((s, i) => {
        const alignClass =
          s.align === "end"
            ? "items-end text-end ms-auto"
            : s.align === "center"
              ? "items-center text-center mx-auto"
              : "items-start text-start me-auto";
        return (
          <div
            key={i}
            aria-hidden={i !== current}
            style={{ transitionDuration: "1000ms" }}
            className={`absolute inset-0 transition-opacity ease-in-out ${
              i === current
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={s.image}
              alt={s.alt}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-transform ease-out ${
                i === current
                  ? "scale-105 duration-[6000ms]"
                  : "scale-100 duration-700"
              }`}
              width={1920}
              height={750}
              {...(i === 0
                ? { fetchPriority: "high" as const }
                : { loading: "lazy" as const })}
            />
            {/* Gradient overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/40 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 h-full container mx-auto px-4 sm:px-6 md:px-10 flex flex-col justify-end pb-16 sm:pb-20 md:pb-28">
              <div
                className={`flex flex-col gap-2.5 sm:gap-3 md:gap-5 max-w-xl ${alignClass}`}
              >
                <span className="inline-block w-fit px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-accent/90 text-accent-foreground text-[10px] sm:text-[11px] md:text-xs font-cairo font-bold tracking-wide shadow-lg shadow-primary/30 backdrop-blur-sm animate-fade-in">
                  {lang === "ar" ? "كي دي دي · منذ 1962" : "KDD · Since 1962"}
                </span>
                <h2
                  className="font-cairo font-extrabold text-white text-xl sm:text-3xl md:text-5xl lg:text-6xl leading-tight drop-shadow-2xl"
                  style={{ textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                >
                  {lang === "ar" ? s.titleAr : s.titleEn}
                </h2>
                <p
                  className="hidden sm:block font-cairo text-white/90 text-sm sm:text-base md:text-lg lg:text-xl max-w-md drop-shadow-lg"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
                >
                  {lang === "ar" ? s.subAr : s.subEn}
                </p>
                <Link
                  to={s.link}
                  aria-label={s.alt}
                  className="group/btn inline-flex w-fit items-center gap-2 mt-0.5 sm:mt-1 md:mt-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-cairo font-bold text-xs sm:text-sm md:text-base shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <span>{lang === "ar" ? s.ctaAr : s.ctaEn}</span>
                  {lang === "ar" ? (
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:-translate-x-1 transition-transform" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                  )}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Prev/Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute start-3 md:start-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-background/20 hover:bg-primary backdrop-blur-md border border-primary-foreground/20 hover:border-primary text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
      >
        {lang === "ar" ? (
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute end-3 md:end-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-background/20 hover:bg-primary backdrop-blur-md border border-primary-foreground/20 hover:border-primary text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
      >
        {lang === "ar" ? (
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-primary-foreground/10">
        <div
          className="h-full bg-primary transition-all duration-300 shadow-sm shadow-primary/50"
          style={{ width: `${((current + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 z-30 flex gap-2.5 px-4 py-2 rounded-full bg-background/20 backdrop-blur-md border border-primary-foreground/20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-500 ${
              i === current
                ? "w-12 h-2.5 bg-primary shadow-lg shadow-primary/40"
                : "w-2.5 h-2.5 bg-primary-foreground/25 hover:bg-primary-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
