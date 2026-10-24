import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Truck, Phone, Menu, Home, Package, CalendarDays, Heart, ShieldCheck, MapPin, ClipboardList } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import logo from '@/assets/makani-foods-logo.png';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
}

const nav = [
  { en: 'Home', ar: 'الرئيسية', to: '/', icon: Home },
  { en: 'Products', ar: 'المنتجات', to: '/products', icon: Package },
  { en: 'Subscriptions', ar: 'الاشتراكات', to: '/subscriptions', icon: CalendarDays },
  { en: 'Our Story', ar: 'قصتنا', to: '/about', icon: Heart },
  { en: 'Quality', ar: 'ضمان الجودة', to: '/quality-guarantee', icon: ShieldCheck },
  { en: 'Branches', ar: 'الفروع', to: '/contact', icon: MapPin },
  { en: 'Track Order', ar: 'تتبع طلبك', to: '/track', icon: ClipboardList },
];

const Header = ({ searchValue, onSearchChange, onSearchFocus }: HeaderProps) => {
  const { lang, setLang } = useLanguage();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') || '');
  }, [location.pathname, location.search]);

  return (
    <>
      <div dir={isAr ? 'rtl' : 'ltr'} className="bg-kd-navy text-kd-navy-foreground text-xs font-cairo">
        <div className="max-w-[1240px] mx-auto px-4 h-9 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{isAr ? 'توصيل مجاني لجميع مناطق الكويت' : 'Free delivery across Kuwait'}</span>
          </span>
          <div className="flex items-center gap-4 shrink-0">
            <a href="tel:+96594428361" className="hidden sm:flex items-center gap-1.5 hover:opacity-80 tabular-nums" dir="ltr">
              <Phone className="w-3.5 h-3.5" /> +965 9442 8361
            </a>
            <Button variant="ghost" size="sm" onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="h-auto p-0 font-bold text-inherit hover:text-inherit hover:bg-transparent hover:opacity-80">
              {isAr ? 'English' : 'عربي'}
            </Button>
          </div>
        </div>
      </div>
      <header dir={isAr ? 'rtl' : 'ltr'} className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border font-cairo">
        <div className="max-w-[1240px] mx-auto h-16 px-3 sm:px-4 flex items-center gap-2 sm:gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-2" aria-label={isAr ? 'كي دي كاو — الرئيسية' : 'KDCow — Home'}>
            <img src={logo} alt="kdkaw" className="h-11 w-auto" />
          </Link>
          <form role="search" className="flex-1 min-w-0 relative max-w-xl" onSubmit={(event) => {
            event.preventDefault();
            if (onSearchChange) return;
            const value = query.trim();
            navigate(value ? `/products?q=${encodeURIComponent(value)}` : '/products');
          }}>
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input type="search" value={searchValue ?? query}
              onChange={(event) => onSearchChange ? onSearchChange(event.target.value) : setQuery(event.target.value)}
              onFocus={onSearchFocus}
              aria-label={isAr ? 'البحث عن المنتجات' : 'Search products'}
              placeholder={isAr ? 'ابحث عن حليب، لبن، آيس كريم…' : 'Search milk, laban, ice cream…'}
              className="h-10 rounded-lg bg-muted text-foreground ps-10 pe-3 text-sm border-transparent focus-visible:border-kd focus-visible:bg-card" />
          </form>
          <DropdownMenu dir={isAr ? 'rtl' : 'ltr'}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={isAr ? 'قائمة الصفحات' : 'Page menu'} title={isAr ? 'قائمة الصفحات' : 'Page menu'} className="shrink-0 border-border text-kd-navy hover:bg-muted data-[state=open]:bg-muted">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-56 max-w-[calc(100vw-24px)] font-cairo p-2">
              {nav.map(item => (
                <DropdownMenuItem key={item.to} asChild className="p-0">
                  <Link to={item.to} aria-current={location.pathname === item.to ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md ${location.pathname === item.to ? 'bg-kd/10 text-kd font-bold' : 'text-foreground'}`}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    {isAr ? item.ar : item.en}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild size="icon" className="relative shrink-0 rounded-lg bg-kd text-kd-foreground hover:bg-kd/90">
            <Link to="/cart" aria-label={isAr ? `السلة، ${totalItems} منتجات` : `Cart, ${totalItems} items`}>
              <ShoppingBag className="!w-5 !h-5" />
              <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-kd-navy text-kd-navy-foreground text-[11px] font-bold flex items-center justify-center tabular-nums">{totalItems}</span>
            </Link>
          </Button>
        </div>
      </header>
    </>
  );
};

export default Header;
