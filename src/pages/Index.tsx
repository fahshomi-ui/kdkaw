import SalePrice from '@/components/SalePrice';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, ChevronLeft, ChevronRight, Truck, ShieldCheck,
  Leaf, Award, Snowflake, CalendarCheck, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useProducts, useCategories, DbProduct } from '@/hooks/useStore';
import SEO from '@/components/SEO';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import heroMilk from '@/assets/hero-milk.jpg';
import heroIce from '@/assets/hero-icecream2.jpg';
import heroJuice from '@/assets/hero-juice2.jpg';
import farm from '@/assets/farm.jpg';
import ad from '@/assets/kdcow/ad.jpg.asset.json';
import ResponsiveImage from '@/components/ResponsiveImage';

const AD_PRODUCT = '5fc15522-3911-897d-0a41-1a7e1d99b103';
const NEW_SLUG = 'new';

const slides = [
  {
    img: heroMilk, to: '/category/fresh-milk', dark: false,
    tagAr: 'طازج كل صباح', tagEn: 'Fresh Every Morning',
    titleAr: 'حليب طازج 100%\nمن مزارعنا إلى بيتك', titleEn: '100% Fresh Milk\nFrom Our Farms to Your Home',
    subAr: 'جودة كي دي كاو التي تثق بها العائلات الكويتية منذ 1962.', subEn: 'The KDCow quality Kuwaiti families have trusted since 1962.',
    ctaAr: 'تسوّق الحليب', ctaEn: 'Shop Milk',
  },
  {
    img: heroIce, to: '/category/ice-cream', dark: true,
    tagAr: 'برّد صيفك', tagEn: 'Chill Your Summer',
    titleAr: 'آيس كريم كريمي\nبنكهات لا تُقاوَم', titleEn: 'Creamy Ice Cream\nIrresistible Flavors',
    subAr: 'أكثر من 40 نوعاً من آيس كريم برّد — لكل أفراد العائلة.', subEn: 'Over 40 varieties of Barrid ice cream for the whole family.',
    ctaAr: 'اكتشف النكهات', ctaEn: 'Discover Flavors',
  },
  {
    img: heroJuice, to: '/category/juices', dark: false,
    tagAr: 'انتعاش طبيعي', tagEn: 'Natural Refreshment',
    titleAr: 'عصائر منعشة\nبطعم الفاكهة الحقيقي', titleEn: 'Refreshing Juices\nReal Fruit Taste',
    subAr: 'برتقال، مانجو، فراولة… انتعاش يومي بجودة مضمونة.', subEn: 'Orange, mango, strawberry — daily refreshment, guaranteed quality.',
    ctaAr: 'تسوّق العصائر', ctaEn: 'Shop Juices',
  },
  {
    img: farm, to: '/about', dark: true,
    tagAr: 'منذ 1962', tagEn: 'Since 1962',
    titleAr: 'إرث من الجودة\nيتجدد كل يوم', titleEn: 'A Legacy of Quality\nRenewed Every Day',
    subAr: 'أبقار مختارة بعناية ومعايير صارمة في كل خطوة.', subEn: 'Carefully selected herds and strict standards at every step.',
    ctaAr: 'قصتنا', ctaEn: 'Our Story',
  },
];

const Index = () => {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { addItem } = useCart();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const [slide, setSlide] = useState(0);
  const [showAd, setShowAd] = useState(() => !sessionStorage.getItem('kdcow_ad_seen'));
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(12);
  const catRef = useRef<HTMLDivElement>(null);
  const catPause = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const el = catRef.current;
      if (!el || catPause.current || window.innerWidth >= 640) return;
      const item = el.firstElementChild as HTMLElement | null;
      const step = (item?.offsetWidth ?? 80) + 12;
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      const dir = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
      if (pos + 5 >= max) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollBy({ left: step * dir, behavior: 'smooth' });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearTimeout(t);
  }, [slide]);

  const go = (d: number) => setSlide((s) => (s + d + slides.length) % slides.length);
  const closeAd = () => { sessionStorage.setItem('kdcow_ad_seen', '1'); setShowAd(false); };

  const cats = useMemo(
    () => [...(categories as any[])].filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const list = useMemo(() => {
    let l = products as DbProduct[];
    if (cat !== 'all') l = l.filter((p) => p.category?.slug === cat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      l = l.filter((p) => p.name_en.toLowerCase().includes(s) || p.name_ar.includes(s));
    }
    return l;
  }, [products, cat, q]);

  const name = (p: DbProduct) => (isAr ? p.name_ar : p.name_en);
  const fmt = (n: number) => `${n.toFixed(3)} ${isAr ? 'د.ك' : 'KWD'}`;
  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Leaf, ar: 'طازج 100%', en: '100% Fresh', dAr: 'حليب طازج بدون بودرة', dEn: 'No powder reconstitution' },
    { icon: Truck, ar: 'توصيل مجاني', en: 'Free Delivery', dAr: 'لجميع مناطق الكويت', dEn: 'All over Kuwait' },
    { icon: Snowflake, ar: 'سلسلة تبريد', en: 'Cold Chain', dAr: 'يصلك بارداً كما خرج', dEn: 'Arrives perfectly chilled' },
    { icon: ShieldCheck, ar: 'دفع آمن', en: 'Secure Payment', dAr: 'كي نت وبطاقات ائتمان', dEn: 'KNET & credit cards' },
  ];

  const s = slides[slide];
  const newItems = (products as DbProduct[]).filter((p) => p.category?.slug === NEW_SLUG);

  const SectionHead = ({ kicker, title, link, linkText }: { kicker: string; title: string; link?: string; linkText?: string }) => (
    <div className="flex items-end justify-between mb-5">
      <div>
        <p className="text-kd text-xs font-bold tracking-widest uppercase flex items-center gap-2"><span className="w-6 h-0.5 bg-kd rounded" />{kicker}</p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-kd-navy">{title}</h2>
      </div>
      {link && <Link to={link} className="text-sm font-bold text-kd inline-flex items-center gap-1 hover:underline">{linkText} <Arrow className="w-3.5 h-3.5" /></Link>}
    </div>
  );

  const Card = ({ p }: { p: DbProduct }) => (
    <article className="group relative h-full rounded-2xl border border-border bg-card p-2.5 flex flex-col hover:border-kd/50 hover:shadow-lg transition">
      {p.category?.slug === NEW_SLUG && (
        <span className="absolute top-3 start-3 z-10 rounded-full bg-kd text-kd-foreground px-2.5 py-0.5 text-[10px] font-bold">{isAr ? 'جديد' : 'New'}</span>
      )}
      <Link to={`/product/${p.id}`} className="block">
        <div className="aspect-square rounded-xl bg-gradient-to-b from-muted/30 to-muted/70 flex items-center justify-center overflow-hidden p-2">
          <ResponsiveImage src={p.image_url ?? ''} alt={name(p)} loading="lazy" className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" />
        </div>
        <h3 className="mt-2 text-[13px] font-bold text-foreground/90 line-clamp-2 min-h-[38px] leading-snug">{name(p)}</h3>
      </Link>
      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
        <SalePrice price={p.price} className="text-sm" />
        <button onClick={() => addItem(p, 1)} disabled={!Number.isFinite(Number(p.price)) || p.price <= 0} aria-label={isAr ? 'أضف للسلة' : 'Add to cart'} className="w-9 h-9 shrink-0 rounded-full bg-kd text-kd-foreground flex items-center justify-center shadow hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed">
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>
    </article>
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground font-cairo">
      <SEO
        title={isAr ? 'كي دي كاو - بيت الحليب الطازج' : 'KDCow - Home of Fresh Milk'}
        description={isAr ? 'كي دي كاو — حليب طازج ولبن وروب وعصائر وآيس كريم مع توصيل في الكويت' : 'KDCow — fresh milk, laban, yogurt, juices and ice cream delivered in Kuwait'}
      />

      <Header
        searchValue={q}
        onSearchChange={setQ}
        onSearchFocus={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Hero slider */}
      <section className="relative h-[460px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-kd-navy">
        {slides.map((sl, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`}>
            <ResponsiveImage
              key={i === slide ? `on-${slide}` : `off-${i}`}
              src={sl.img}
              alt={isAr ? sl.tagAr : sl.tagEn}
              width={1600}
              height={800}
              sizes="100vw"
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`w-full h-full object-cover ${i === slide ? 'kd-kenburns' : ''}`}
            />
          </div>
        ))}
        <div className={`absolute inset-0 ${isAr ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-kd-navy/90 via-kd-navy/55 to-transparent`} />

        <div className="relative h-full max-w-[1240px] mx-auto px-6 flex items-center">
          <div key={slide} className="max-w-xl text-kd-navy-foreground">
            <span className="kd-rise inline-flex items-center gap-2 rounded-full bg-kd px-3 py-1 text-xs font-bold tracking-wide" style={{ animationDelay: '.1s' }}>
              <Award className="w-3.5 h-3.5" /> {isAr ? s.tagAr : s.tagEn}
            </span>
            <h2 className="kd-rise mt-4 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.15] whitespace-pre-line" style={{ animationDelay: '.25s' }}>
              {isAr ? s.titleAr : s.titleEn}
            </h2>
            <p className="kd-rise mt-4 text-sm sm:text-lg opacity-90 max-w-md" style={{ animationDelay: '.45s' }}>
              {isAr ? s.subAr : s.subEn}
            </p>
            <div className="kd-rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: '.6s' }}>
              <Link to={s.to} className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-kd text-kd-foreground font-bold shadow-lg hover:brightness-110 transition">
                {isAr ? s.ctaAr : s.ctaEn} <Arrow className="w-4 h-4" />
              </Link>
              <a href="#shop" className="inline-flex items-center h-12 px-6 rounded-lg border border-kd-navy-foreground/50 font-bold hover:bg-kd-navy-foreground/10 transition">
                {isAr ? 'كل المنتجات' : 'All Products'}
              </a>
            </div>
          </div>
        </div>

        <button onClick={() => go(-1)} aria-label="prev" className="absolute top-1/2 -translate-y-1/2 start-3 w-11 h-11 rounded-full bg-kd-navy-foreground/15 backdrop-blur text-kd-navy-foreground hidden sm:flex items-center justify-center hover:bg-kd transition">
          <Prev className="w-5 h-5" />
        </button>
        <button onClick={() => go(1)} aria-label="next" className="absolute top-1/2 -translate-y-1/2 end-3 w-11 h-11 rounded-full bg-kd-navy-foreground/15 backdrop-blur text-kd-navy-foreground hidden sm:flex items-center justify-center hover:bg-kd transition">
          <Next className="w-5 h-5" />
        </button>

        <div className="absolute bottom-14 inset-x-0 max-w-[1240px] mx-auto px-6 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} aria-label={`slide ${i + 1}`} className="h-1 w-12 rounded-full bg-kd-navy-foreground/30 overflow-hidden">
              {i === slide && <span key={slide} className="block h-full bg-kd kd-progress" />}
              {i < slide && <span className="block h-full w-full bg-kd-navy-foreground/80" />}
            </button>
          ))}
        </div>

        {/* Logo-inspired wave */}
        <svg className="absolute bottom-0 inset-x-0 w-full h-12 text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
          <path d="M0,40 C360,90 1080,0 1440,40 L1440,80 L0,80 Z" className="fill-kd-sky/60" />
          <path d="M0,55 C400,95 1040,20 1440,55 L1440,80 L0,80 Z" fill="currentColor" />
        </svg>
      </section>

      {/* Features strip */}
      <section className="max-w-[1240px] mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-card border border-border shadow-xl overflow-hidden divide-border [&>*]:border-border [&>*:nth-child(odd)]:border-e [&>*:nth-child(-n+2)]:border-b lg:[&>*:nth-child(-n+2)]:border-b-0 lg:[&>*:not(:last-child)]:border-e">
          {features.map((f) => (
            <div key={f.en} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-2.5 p-4 sm:p-5">
              <span className="w-11 h-11 rounded-full bg-kd-soft text-kd flex items-center justify-center shrink-0 ring-4 ring-kd-soft/50"><f.icon className="w-5 h-5" /></span>
              <div className="min-w-0">
                <p className="font-black text-sm text-kd-navy">{isAr ? f.ar : f.en}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{isAr ? f.dAr : f.dEn}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-[1240px] mx-auto px-4 mt-14">
        <SectionHead kicker={isAr ? 'تشكيلتنا' : 'Our Range'} title={isAr ? 'تسوّق حسب القسم' : 'Shop by Category'} link="/products" linkText={isAr ? 'عرض الكل' : 'View all'} />
        <div
          ref={catRef}
          onTouchStart={() => (catPause.current = true)}
          onTouchEnd={() => setTimeout(() => (catPause.current = false), 4000)}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-5 sm:gap-x-3 sm:gap-y-5 sm:overflow-visible sm:mx-0 sm:px-0"
        >
          {cats.map((c: any) => (
            <Link key={c.id} to={`/category/${c.slug}`} className="group snap-start shrink-0 w-[23%] sm:w-auto flex flex-col items-center text-center">
              <div className="w-full aspect-square rounded-full p-[3px] bg-gradient-to-br from-kd to-kd-navy shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition">
                <div className="w-full h-full rounded-full bg-card p-1 overflow-hidden">
                  {c.image_url && <ResponsiveImage src={c.image_url} alt={isAr ? c.name_ar : c.name_en} sizes="(max-width: 640px) 23vw, 240px" loading="lazy" className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                </div>
              </div>
              <p className="mt-2 text-[11px] sm:text-sm font-bold leading-tight text-kd-navy group-hover:text-kd">{isAr ? c.name_ar : c.name_en}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {newItems.length > 0 && (
        <section className="mt-14 py-10 bg-kd-soft">
          <div className="max-w-[1240px] mx-auto px-4">
            <SectionHead kicker={isAr ? 'وصل حديثاً' : 'Just Arrived'} title={isAr ? 'أحدث المنتجات' : 'New Arrivals'} link={`/category/${NEW_SLUG}`} linkText={isAr ? 'عرض الكل' : 'View all'} />
            <div className="flex gap-3 overflow-x-auto snap-x pb-3 -mx-4 px-4 scrollbar-none">
              {newItems.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-[44%] sm:w-52"><Card p={p} /></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop */}
      <main id="shop" className="max-w-[1240px] mx-auto px-4 mt-14 scroll-mt-24">
        <SectionHead kicker={isAr ? 'المتجر' : 'Shop'} title={isAr ? 'منتجاتنا' : 'Our Products'} />
        <div className="sticky top-[104px] lg:top-16 z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {[{ id: 'all', slug: 'all', name_ar: 'الكل', name_en: 'All' }, ...cats].map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setCat(c.slug); setLimit(12); }}
                className={`shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-bold border transition ${cat === c.slug ? 'bg-kd text-kd-foreground border-kd shadow' : 'bg-card text-foreground/80 border-border hover:border-kd hover:text-kd'}`}
              >
                {isAr ? c.name_ar : c.name_en}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 tabular-nums">{list.length} {isAr ? 'منتج' : 'products'}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {list.slice(0, limit).map((p) => <Card key={p.id} p={p} />)}
        </div>
        {list.length > limit && (
          <div className="mt-6 text-center">
            <button onClick={() => setLimit((l) => l + 12)} className="h-11 px-8 rounded-full border-2 border-kd text-kd font-black hover:bg-kd hover:text-kd-foreground transition">
              {isAr ? `عرض المزيد (${list.length - limit})` : `Show more (${list.length - limit})`}
            </button>
          </div>
        )}
      </main>

      {/* Story */}
      <section className="mt-16 bg-kd-navy text-kd-navy-foreground">
        <div className="max-w-[1240px] mx-auto grid lg:grid-cols-2">
          <ResponsiveImage src={farm} alt={isAr ? 'مزارع كي دي كاو' : 'KDCow farms'} sizes="(max-width: 1024px) 100vw, 620px" loading="lazy" width={1600} height={912} className="w-full h-56 sm:h-72 lg:h-full object-cover" />
          <div className="p-6 sm:p-12">
            <p className="text-kd-sky text-xs font-bold tracking-widest uppercase">{isAr ? 'قصتنا' : 'Our Story'}</p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black leading-tight whitespace-pre-line">
              {isAr ? 'أكثر من 60 عاماً\nمن الطزاجة والثقة' : 'Over 60 Years of\nFreshness & Trust'}
            </h2>
            <p className="mt-4 opacity-85 leading-relaxed text-sm sm:text-base">
              {isAr
                ? 'منذ عام 1962 وكي دي كاو تقدّم للعائلات الكويتية حليباً طازجاً ولبناً وروباً وعصائر وآيس كريم بمعايير جودة صارمة، من المزرعة حتى باب بيتك.'
                : 'Since 1962, KDCow has brought Kuwaiti families fresh milk, laban, yogurt, juices and ice cream under strict quality standards — from farm to your door.'}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2 tabular-nums">
              {[
                { n: '1962', ar: 'سنة التأسيس', en: 'Founded' },
                { n: `${products.length || 130}+`, ar: 'منتج', en: 'Products' },
                { n: `${cats.length || 10}`, ar: 'أقسام', en: 'Categories' },
              ].map((x) => (
                <div key={x.en} className="rounded-xl bg-kd-navy-foreground/10 p-3 text-center">
                  <p className="text-xl sm:text-3xl font-black text-kd-sky">{x.n}</p>
                  <p className="text-[11px] opacity-80">{isAr ? x.ar : x.en}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/about" className="h-11 px-5 rounded-lg bg-kd text-kd-foreground font-bold inline-flex items-center gap-2">
                {isAr ? 'اقرأ قصتنا' : 'Read our story'} <Arrow className="w-4 h-4" />
              </Link>
              <Link to="/quality-guarantee" className="h-11 px-5 rounded-lg border border-kd-navy-foreground/40 font-bold inline-flex items-center">
                {isAr ? 'ضمان الجودة' : 'Quality guarantee'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="max-w-[1240px] mx-auto px-4 my-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kd to-kd-navy text-kd-foreground p-7 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <span className="absolute -top-16 -end-16 w-56 h-56 rounded-full bg-kd-foreground/10" aria-hidden />
          <span className="absolute -bottom-20 start-1/3 w-40 h-40 rounded-full bg-kd-foreground/5" aria-hidden />
          <div className="relative flex items-start gap-4">
            <span className="w-12 h-12 rounded-2xl bg-kd-foreground/15 flex items-center justify-center shrink-0"><CalendarCheck className="w-6 h-6" /></span>
            <div>
              <h2 className="text-xl sm:text-3xl font-black">{isAr ? 'حليبك يصلك تلقائياً' : 'Your Milk, Delivered Automatically'}</h2>
              <p className="mt-1 opacity-90 text-sm sm:text-base">{isAr ? 'اشترك في التوصيل الأسبوعي ولا تقلق من نفاد الحليب من ثلاجتك أبداً.' : 'Subscribe to weekly delivery and never run out of milk again.'}</p>
            </div>
          </div>
          <Link to="/subscriptions" className="relative h-12 px-6 rounded-full bg-card text-kd font-black inline-flex items-center gap-2 shrink-0 shadow-lg">
            {isAr ? 'تصفّح الاشتراكات' : 'Browse plans'} <Arrow className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />

      {/* WhatsApp */}
      <a href="https://wa.me/96594428361" target="_blank" rel="noreferrer" className="fixed bottom-6 end-6 z-40 flex items-center gap-3">
        <span className="hidden sm:block bg-card border border-border shadow px-3 py-1.5 rounded-lg text-sm font-semibold">{isAr ? 'راسلنا' : 'Chat with us'}</span>
        <span className="w-12 h-12 rounded-full bg-kd-whatsapp text-kd-foreground flex items-center justify-center shadow-lg">
          <MessageCircle className="w-6 h-6" />
        </span>
      </a>

      {/* Ad popup */}
      {showAd && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAd}>
          <div className="bg-card p-2.5 rounded-2xl w-full max-w-[480px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Link to={`/product/${AD_PRODUCT}`} onClick={closeAd}>
              <ResponsiveImage src={ad.url} alt="kdkaw" priority sizes="(max-width: 512px) calc(100vw - 52px), 460px" width={1000} height={1000} className="w-full block rounded-xl" />
            </Link>
            <button onClick={closeAd} className="w-full mt-2 h-10 bg-kd text-kd-foreground rounded-lg text-sm font-bold">
              {isAr ? 'تخطي الإعلان' : 'Skip Ad'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
