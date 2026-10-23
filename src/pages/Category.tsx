import { getProductPricing } from '@/lib/pricing';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCategoryBySlug,
  useCategoryProducts,
  useCategoryTree,
  type CategoryNode,
} from '@/hooks/useStore';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  LayoutGrid,
} from 'lucide-react';

const findPath = (
  nodes: CategoryNode[],
  slug: string,
  trail: CategoryNode[] = []
): CategoryNode[] | null => {
  for (const n of nodes) {
    const next = [...trail, n];
    if (n.slug === slug) return next;
    if (n.children?.length) {
      const r = findPath(n.children, slug, next);
      if (r) return r;
    }
  }
  return null;
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const Chevron = lang === 'ar' ? ChevronLeft : ChevronRight;

  const { data: tree } = useCategoryTree();
  const { data: cat } = useCategoryBySlug(slug);
  const { data: products, isLoading } = useCategoryProducts(slug);

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('default');

  const breadcrumb = useMemo(
    () => (tree && slug ? findPath(tree, slug) || [] : []),
    [tree, slug]
  );

  const currentNode = useMemo(() => {
    if (!tree || !slug) return null;
    const path = findPath(tree, slug);
    return path ? path[path.length - 1] : null;
  }, [tree, slug]);

  const childCategories = currentNode?.children || [];

  const origins = useMemo(() => {
    const s = new Set<string>();
    (products || []).forEach((p) => p.origin && s.add(p.origin));
    return Array.from(s).sort();
  }, [products]);

  const maxPrice = useMemo(() => {
    const arr = (products || []).map((p) => getProductPricing(p.price).unitPrice);
    return arr.length ? Math.ceil(Math.max(...arr)) : 50;
  }, [products]);

  const toggleOrigin = (o: string) =>
    setSelectedOrigins((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedOrigins([]);
    setSortBy('default');
    setSearch('');
  };

  const hasActiveFilters =
    selectedOrigins.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    sortBy !== 'default';

  const filtered = useMemo(() => {
    let res = (products || []).filter((p) => {
      const name = lang === 'ar' ? p.name_ar : p.name_en;
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
      const price = getProductPricing(p.price).unitPrice;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (
        selectedOrigins.length > 0 &&
        (!p.origin || !selectedOrigins.includes(p.origin))
      )
        return false;
      return true;
    });
    if (sortBy === 'price-asc')
      res.sort((a, b) => getProductPricing(a.price).unitPrice - getProductPricing(b.price).unitPrice);
    else if (sortBy === 'price-desc')
      res.sort((a, b) => getProductPricing(b.price).unitPrice - getProductPricing(a.price).unitPrice);
    else if (sortBy === 'name')
      res.sort((a, b) => {
        const na = lang === 'ar' ? a.name_ar : a.name_en;
        const nb = lang === 'ar' ? b.name_ar : b.name_en;
        return na.localeCompare(nb);
      });
    return res;
  }, [products, search, priceRange, selectedOrigins, sortBy, lang]);

  if (!slug || (!isLoading && !cat)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center font-cairo">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {lang === 'ar' ? 'الفئة غير موجودة' : 'Category not found'}
          </h1>
          <Link to="/" className="text-primary hover:underline text-sm">
            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to home'}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb header */}
      <div className="bg-gradient-to-b from-secondary/40 to-background border-b border-border">
        <div className="container mx-auto px-4 py-5">
          <nav
            className="flex items-center gap-1 text-[12px] font-cairo text-muted-foreground mb-3 overflow-x-auto scrollbar-hide"
            aria-label="breadcrumb"
          >
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-primary whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            {breadcrumb.map((b, i) => (
              <span key={b.id} className="flex items-center gap-1 whitespace-nowrap">
                <Chevron className="w-3 h-3 opacity-60" />
                {i === breadcrumb.length - 1 ? (
                  <span className="text-foreground font-semibold">
                    {lang === 'ar' ? b.name_ar : b.name_en}
                  </span>
                ) : (
                  <Link to={`/category/${b.slug}`} className="hover:text-primary">
                    {lang === 'ar' ? b.name_ar : b.name_en}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-black font-cairo text-foreground leading-tight">
                {lang === 'ar' ? cat?.name_ar : cat?.name_en}
              </h1>
              {!isLoading && (
                <p className="text-xs md:text-sm text-muted-foreground font-cairo mt-1">
                  {filtered.length}{' '}
                  {lang === 'ar' ? 'منتج متوفر' : 'products available'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6">
        {/* Sub-category pills */}
        {childCategories.length > 0 && (
          <div className="mb-6 -mx-3 sm:-mx-4">
            <div className="overflow-x-auto scrollbar-hide px-3 sm:px-4">
              <div className="flex gap-2 sm:gap-2.5 pb-2 w-max">
                <Link
                  to={`/category/${slug}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-cairo font-bold border bg-primary text-primary-foreground border-primary shadow-sm whitespace-nowrap"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'كل المنتجات' : 'All'}
                </Link>
                {childCategories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-cairo font-semibold border bg-secondary text-foreground/80 border-border hover:border-primary/50 hover:text-primary transition-all whitespace-nowrap"
                  >
                    {lang === 'ar' ? c.name_ar : c.name_en}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search + Filters toggle */}
        <div className="flex gap-2 max-w-lg mx-auto mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={lang === 'ar' ? 'ابحث في هذا القسم...' : 'Search this section...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 font-cairo bg-secondary border-border rounded-lg"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0 relative rounded-lg"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -end-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
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
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline font-cairo flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-cairo font-semibold text-foreground/70 mb-3 block">
                {lang === 'ar' ? 'نطاق السعر' : 'Price Range'}:{' '}
                {priceRange[0].toFixed(1)} - {priceRange[1].toFixed(1)}{' '}
                {lang === 'ar' ? 'د.ك' : 'KWD'}
              </label>
              <Slider
                min={0}
                max={maxPrice}
                step={0.5}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
              />
            </div>

            {origins.length > 0 && (
              <div>
                <label className="text-xs font-cairo font-semibold text-foreground/70 mb-2 block">
                  {lang === 'ar' ? 'المصدر / البلد' : 'Origin / Country'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {origins.map((o) => (
                    <button
                      key={o}
                      onClick={() => toggleOrigin(o)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-medium border transition-all ${
                        selectedOrigins.includes(o)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground/70 border-border hover:border-primary/50'
                      }`}
                    >
                      {o}
                    </button>
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
                  { v: 'default', ar: 'الافتراضي', en: 'Default' },
                  { v: 'price-asc', ar: 'السعر: الأقل', en: 'Price: Low' },
                  { v: 'price-desc', ar: 'السعر: الأعلى', en: 'Price: High' },
                  { v: 'name', ar: 'الاسم', en: 'Name' },
                ].map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setSortBy(s.v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-medium border transition-all ${
                      sortBy === s.v
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground/70 border-border hover:border-primary/50'
                    }`}
                  >
                    {lang === 'ar' ? s.ar : s.en}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-52 sm:h-56 rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground font-cairo">
            {lang === 'ar' ? 'لا توجد منتجات في هذه الفئة' : 'No products in this category'}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Category;
