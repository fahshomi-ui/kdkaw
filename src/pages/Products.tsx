import { getProductPricing } from '@/lib/pricing';
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts, useCategoryTree } from '@/hooks/useStore';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import ProductCard from '@/components/ProductCard';
import Layout from '@/components/Layout';
import PageHero from '@/components/PageHero';
import heroProducts from '@/assets/hero-milk.jpg';



const Products = () => {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('default');
  const { data: tree } = useCategoryTree();
  // Always fetch ALL products; filter in client by descendant slugs
  const { data: products, isLoading } = useProducts('all');

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  // Top-level sections for quick filter pills
  const sections = tree || [];
  const allCategories = [
    { slug: 'all', name_ar: 'كل المنتجات', name_en: 'All Products' },
    ...sections.map((s) => ({ slug: s.slug, name_ar: s.name_ar, name_en: s.name_en })),
  ];

  // Build descendants map for selected category
  const descendantSlugs = useMemo(() => {
    if (category === 'all' || !tree) return null;
    const collect = (nodes: any[], target: string, found: Set<string>, inside: boolean) => {
      for (const n of nodes) {
        const here = inside || n.slug === target;
        if (here) found.add(n.slug);
        if (n.children?.length) collect(n.children, target, found, here);
      }
    };
    const set = new Set<string>();
    collect(tree, category, set, false);
    return set;
  }, [category, tree]);

  const origins = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach(p => { if (p.origin) set.add(p.origin); });
    return Array.from(set).sort();
  }, [products]);

  const maxPrice = useMemo(() => {
    const prices = (products || []).map(p => getProductPricing(p.price).unitPrice);
    return prices.length ? Math.ceil(Math.max(...prices)) : 50;
  }, [products]);

  const toggleOrigin = (o: string) => {
    setSelectedOrigins(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  };

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedOrigins([]);
    setSortBy('default');
    setSearch('');
  };

  const hasActiveFilters = selectedOrigins.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice || sortBy !== 'default';

  const filtered = useMemo(() => {
    let result = (products || []).filter(p => {
      if (descendantSlugs && p.category?.slug && !descendantSlugs.has(p.category.slug)) return false;
      const name = lang === 'ar' ? p.name_ar : p.name_en;
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
      const price = getProductPricing(p.price).unitPrice;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (selectedOrigins.length > 0 && (!p.origin || !selectedOrigins.includes(p.origin))) return false;
      return true;
    });

    if (sortBy === 'price-asc') result.sort((a, b) => getProductPricing(a.price).unitPrice - getProductPricing(b.price).unitPrice);
    else if (sortBy === 'price-desc') result.sort((a, b) => getProductPricing(b.price).unitPrice - getProductPricing(a.price).unitPrice);
    else if (sortBy === 'name') result.sort((a, b) => {
      const na = lang === 'ar' ? a.name_ar : a.name_en;
      const nb = lang === 'ar' ? b.name_ar : b.name_en;
      return na.localeCompare(nb);
    });

    return result;
  }, [products, search, priceRange, selectedOrigins, sortBy, lang, descendantSlugs]);

  return (
    <Layout>
      <PageHero
        bgImage={heroProducts}
        lang={lang}
        icons={<ShoppingBasket className="w-7 h-7" />}
        titleAr="كل المنتجات"
        titleEn="All Products"
        subtitleAr="تسوّق تشكيلة كي دي كاو من الألبان والعصائر والآيس كريم والسمنة"
        subtitleEn="Shop KDCow dairy, juices, ice cream and ghee"
      />

      <div className="container mx-auto px-3 sm:px-4 py-8">

        {/* Search + Filter toggle */}
        <div className="flex gap-2 max-w-lg mx-auto mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder={t('products.search')} value={search} onChange={e => setSearch(e.target.value)} className="ps-10 font-cairo bg-secondary border-border rounded-lg" />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0 relative rounded-lg"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -end-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="max-w-2xl mx-auto mb-8 p-5 rounded-xl bg-secondary/50 border border-border space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-cairo font-bold text-foreground text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {lang === 'ar' ? 'الفلاتر' : 'Filters'}
              </h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline font-cairo flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-cairo font-semibold text-foreground/70 mb-3 block">
                {lang === 'ar' ? 'نطاق السعر' : 'Price Range'}: {priceRange[0].toFixed(1)} - {priceRange[1].toFixed(1)} {lang === 'ar' ? 'د.ك' : 'KWD'}
              </label>
              <Slider min={0} max={maxPrice} step={0.5} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="mt-2" />
            </div>

            {origins.length > 0 && (
              <div>
                <label className="text-xs font-cairo font-semibold text-foreground/70 mb-2 block">
                  {lang === 'ar' ? 'المصدر / البلد' : 'Origin / Country'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {origins.map(o => (
                    <button key={o} onClick={() => toggleOrigin(o)} className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-medium border transition-all duration-200 ${
                      selectedOrigins.includes(o) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground/70 border-border hover:border-primary/50'
                    }`}>{o}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-cairo font-semibold text-foreground/70 mb-2 block">
                {lang === 'ar' ? 'الترتيب' : 'Sort by'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'default', ar: 'الافتراضي', en: 'Default' },
                  { value: 'price-asc', ar: 'السعر: الأقل', en: 'Price: Low' },
                  { value: 'price-desc', ar: 'السعر: الأعلى', en: 'Price: High' },
                  { value: 'name', ar: 'الاسم', en: 'Name' },
                ].map(s => (
                  <button key={s.value} onClick={() => setSortBy(s.value)} className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-medium border transition-all duration-200 ${
                    sortBy === s.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground/70 border-border hover:border-primary/50'
                  }`}>{lang === 'ar' ? s.ar : s.en}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category pills - horizontal scroll */}
        <div className="relative mb-8 -mx-3 sm:-mx-4">
          <div className="overflow-x-auto scrollbar-hide px-3 sm:px-4">
            <div className="flex justify-start sm:justify-center gap-2 sm:gap-3 pb-2 w-max mx-auto min-w-full">
              {allCategories.map(c => (
                <button key={c.slug} onClick={() => setCategory(c.slug)} className={`shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-cairo font-semibold border transition-all duration-300 active:scale-95 whitespace-nowrap ${
                  category === c.slug
                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                    : 'bg-secondary text-foreground/80 border-border hover:border-primary/50 hover:text-primary hover:shadow-sm'
                }`}>
                  {lang === 'ar' ? c.name_ar : c.name_en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isLoading && (
          <p className="text-center text-xs text-muted-foreground font-cairo mb-4">
            {filtered.length} {lang === 'ar' ? 'منتج' : 'products'}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-52 sm:h-56 rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground font-cairo text-lg">
            {lang === 'ar' ? 'لا توجد منتجات مطابقة' : 'No matching products'}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
