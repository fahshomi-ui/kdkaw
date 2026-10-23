import { ReactNode } from 'react';

interface PageHeroProps {
  bgImage: string;
  icons: ReactNode;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  lang: 'ar' | 'en';
}

const PageHero = ({ bgImage, icons, titleAr, titleEn, subtitleAr, subtitleEn, lang }: PageHeroProps) => {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/70 dark:from-background/90 dark:via-background/75 dark:to-background/60" aria-hidden="true" />
      {/* Subtle primary tint */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent" aria-hidden="true" />

      <div className="relative container mx-auto px-4 py-12 sm:py-16 text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-3 text-primary">
          {icons}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-cairo font-extrabold text-foreground mb-3 drop-shadow-sm">
          {lang === 'ar' ? titleAr : titleEn}
        </h1>
        <p className="text-sm sm:text-base text-foreground/75 font-cairo max-w-xl mx-auto leading-relaxed">
          {lang === 'ar' ? subtitleAr : subtitleEn}
        </p>
      </div>
    </section>
  );
};

export default PageHero;
