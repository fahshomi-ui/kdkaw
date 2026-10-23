import type { ReactNode } from "react";
import { useLanguage } from "@/kdd/contexts/LanguageContext";

export default function PageHero({
  bgImage,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  icon,
}: {
  bgImage: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  icon?: ReactNode;
}) {
  const { lang } = useLanguage();
  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      aria-label={lang === "ar" ? titleAr : titleEn}
    >
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-background/95 via-background/80 to-background/35" />
      <div className="kdd-container flex min-h-48 flex-col justify-center py-10 md:min-h-64">
        <div className="mb-3 flex items-center gap-2 text-primary">{icon}</div>
        <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">
          {lang === "ar" ? titleAr : titleEn}
        </h1>
        {(subtitleAr || subtitleEn) && (
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            {lang === "ar" ? subtitleAr : subtitleEn}
          </p>
        )}
      </div>
    </section>
  );
}
