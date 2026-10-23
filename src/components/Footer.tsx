import { Phone, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import logoDark from '@/assets/makani-foods-logo.png';

const Footer = () => {
  const { lang, t } = useLanguage();

  const shopLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/products', label: lang === 'ar' ? 'كل المنتجات' : 'All Products' },
    { to: '/category/dairy-products', label: lang === 'ar' ? 'الألبان' : 'Dairy' },
    { to: '/category/juices', label: lang === 'ar' ? 'العصائر' : 'Juices' },
    { to: '/category/ice-cream', label: lang === 'ar' ? 'الآيس كريم' : 'Ice Cream' },
    { to: '/category/ghee', label: lang === 'ar' ? 'السمنة' : 'Ghee' },
  ];

  const companyLinks = [
    { to: '/about', label: lang === 'ar' ? 'من نحن' : 'About' },
    { to: '/contact', label: lang === 'ar' ? 'تواصل معنا' : 'Contact' },
    { to: '/quality-guarantee', label: lang === 'ar' ? 'ضمان الجودة' : 'Guarantee' },
  ];

  const legalLinks = [
    { to: '/legal/terms', label: lang === 'ar' ? 'الشروط' : 'Terms' },
    { to: '/legal/privacy', label: lang === 'ar' ? 'الخصوصية' : 'Privacy' },
    { to: '/legal/refund', label: lang === 'ar' ? 'الإرجاع' : 'Refund' },
    { to: '/legal/faq', label: lang === 'ar' ? 'الأسئلة' : 'FAQ' },
  ];

  return (
    <footer className="bg-primary">
      {/* Mobile layout */}
      <div className="sm:hidden container mx-auto px-4 py-6">
        {/* Brand + Social */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logoDark} alt="KDCow" className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0" />
            <div className="min-w-0">
              <div className="font-cairo font-bold text-sm text-primary-foreground leading-tight truncate">
                {lang === 'ar' ? 'كي دي كاو' : 'KDCow'}
              </div>
              <div className="text-[10px] text-primary-foreground/50 font-cairo mt-0.5">
                {lang === 'ar' ? 'طازج كل يوم' : 'Fresh Daily'}
              </div>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground font-cairo mb-2 uppercase tracking-wide">
              {lang === 'ar' ? 'تسوّق' : 'Shop'}
            </h4>
            <ul className="space-y-1.5">
              {shopLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[11px] text-primary-foreground/60 active:text-primary-foreground font-cairo block leading-tight">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground font-cairo mb-2 uppercase tracking-wide">
              {lang === 'ar' ? 'الشركة' : 'Company'}
            </h4>
            <ul className="space-y-1.5">
              {companyLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[11px] text-primary-foreground/60 active:text-primary-foreground font-cairo block leading-tight">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground font-cairo mb-2 uppercase tracking-wide">
              {lang === 'ar' ? 'قانوني' : 'Legal'}
            </h4>
            <ul className="space-y-1.5">
              {legalLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[11px] text-primary-foreground/60 active:text-primary-foreground font-cairo block leading-tight">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact removed */}

        {/* Copyright */}
        <div className="mt-4 pt-3 border-t border-primary-foreground/10 text-center">
          <p className="text-[10px] text-primary-foreground/40 font-cairo">
            © 2026 · {t('footer.rights')}
          </p>
        </div>
      </div>

      {/* Desktop layout (unchanged) */}
      <div className="hidden sm:block container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logoDark} alt="KDCow" className="w-9 h-9 md:w-11 md:h-11 object-contain shrink-0" />
            <span className="font-cairo font-bold text-sm md:text-base text-primary-foreground whitespace-nowrap">
              {lang === 'ar' ? 'كي دي كاو' : 'KDCow'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {[...shopLinks, ...companyLinks, ...legalLinks].map(link => (
              <Link key={link.to} to={link.to} className="text-primary-foreground/60 hover:text-primary-foreground text-xs font-cairo transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact removed */}

        </div>

        <div className="border-t border-primary-foreground/10 mt-4 pt-3 text-center">
          <p className="text-[10px] text-primary-foreground/30 font-cairo">
            © 2026 {lang === 'ar' ? 'كي دي كاو' : 'KDCow'} · {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
