import { Link } from "react-router-dom";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import logoDark from "@/kdd/assets/makani-foods-logo.png";

export default function Footer() {
  const { lang, t } = useLanguage();
  const shopLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: lang === "ar" ? "كل المنتجات" : "All Products" },
    { to: "/category/kdd-dairy", label: lang === "ar" ? "الألبان" : "Dairy" },
    { to: "/category/kdd-juices", label: lang === "ar" ? "العصائر" : "Juices" },
    {
      to: "/category/kdd-icecream",
      label: lang === "ar" ? "الآيس كريم" : "Ice Cream",
    },
    {
      to: "/category/kdd-cooking",
      label: lang === "ar" ? "منتجات الطهي" : "Cooking Products",
    },
  ];
  const companyLinks = [
    { to: "/about", label: lang === "ar" ? "من نحن" : "About" },
    { to: "/contact", label: lang === "ar" ? "تواصل معنا" : "Contact" },
    {
      to: "/quality-guarantee",
      label: lang === "ar" ? "ضمان الجودة" : "Guarantee",
    },
  ];
  const legalLinks = [
    { to: "/legal/terms", label: lang === "ar" ? "الشروط" : "Terms" },
    { to: "/legal/privacy", label: lang === "ar" ? "الخصوصية" : "Privacy" },
    { to: "/legal/refund", label: lang === "ar" ? "الإرجاع" : "Refund" },
    { to: "/legal/faq", label: lang === "ar" ? "الأسئلة" : "FAQ" },
  ];
  const groups = [
    { title: lang === "ar" ? "تسوّق" : "Shop", links: shopLinks },
    { title: lang === "ar" ? "الشركة" : "Company", links: companyLinks },
    { title: lang === "ar" ? "قانوني" : "Legal", links: legalLinks },
  ];

  return (
    <footer className="mt-12 bg-primary text-primary-foreground">
      <div className="kdd-container py-7 sm:py-8">
        <div className="mb-6 flex items-center gap-2.5">
          <img
            src={logoDark}
            alt="KDD"
            className="h-10 w-12 shrink-0 object-contain sm:h-12 sm:w-14"
          />
          <div>
            <div className="text-sm font-bold leading-tight sm:text-base">
              {lang === "ar" ? "كي دي دي" : "KDD"}
            </div>
            <div className="mt-0.5 text-[10px] text-primary-foreground/55">
              {lang === "ar" ? "طازج كل يوم" : "Fresh Daily"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {groups.map(group => (
            <div key={group.title}>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide">
                {group.title}
              </h4>
              <ul className="space-y-1.5">
                {group.links.map(link => (
                  <li key={link.to}>
                    {group.links === shopLinks ? (
                      <Link
                        to={link.to}
                        className="block text-[11px] text-primary-foreground/65 transition-colors hover:text-primary-foreground sm:text-xs"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={`https://kddproducts.lovable.app${link.to}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-primary-foreground/65 transition-colors hover:text-primary-foreground sm:text-xs"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-primary-foreground/10 pt-3 text-center">
          <p className="text-[10px] text-primary-foreground/40">
            © 2026 {lang === "ar" ? "كي دي دي" : "KDD"} ·{" "}
            {lang === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>
    </footer>
  );
}
