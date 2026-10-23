import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ShoppingBasket, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/kdd/components/Layout";
import PageHero from "@/kdd/components/PageHero";
import ProductCard from "@/kdd/components/ProductCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/kdd/components/CatalogState";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { useCategoryTree, useProducts } from "@/kdd/hooks/useStore";
import productsHero from "@/kdd/assets/products-hero.jpg";
import referenceSnapshot from "@/kdd/data/reference-layout.json";

function descendants(
  nodes: any[],
  slug: string,
  found = new Set<string>(),
  inside = false
) {
  nodes.forEach(node => {
    const here =
      inside ||
      node.slug === slug ||
      String(node.id) === slug ||
      String(node.category_id) === slug;
    if (here) {
      if (node.slug) found.add(String(node.slug));
      if (node.id != null) found.add(String(node.id));
      if (node.category_id != null) found.add(String(node.category_id));
    }
    if (node.children?.length) descendants(node.children, slug, found, here);
  });
  return found;
}

export default function Products() {
  const { lang, t } = useLanguage();
  const [params] = useSearchParams();
  const query = useProducts("all");
  const { data: tree } = useCategoryTree();
  const rawProducts = (query.data ?? []) as any[];
  const reference = referenceSnapshot as {
    familyOrder: string[];
    allProductOrder: string[];
  };
  const products = useMemo(() => {
    const order = new Map(
      reference.allProductOrder.map((id, index) => [String(id), index])
    );
    return [...rawProducts].sort(
      (a, b) =>
        (order.get(String(a.id)) ?? 999) - (order.get(String(b.id)) ?? 999)
    );
  }, [rawProducts]);
  const [category, setCategory] = useState(params.get("category") || "all");
  const [search, setSearch] = useState(params.get("q") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("default");
  const [origin, setOrigin] = useState("all");
  const maxPrice = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(Math.max(...products.map(p => Number(p.price || 0)), 1))
      ),
    [products]
  );
  const [priceMax, setPriceMax] = useState(maxPrice);
  useEffect(() => setPriceMax(maxPrice), [maxPrice]);
  const section = (tree ?? []).find((node: any) => node.slug === "section-kdd");
  const order = new Map(
    reference.familyOrder.map((slug, index) => [slug, index])
  );
  const familyNodes = [...(section?.children ?? tree ?? [])].sort(
    (a: any, b: any) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)
  );
  const categories = [
    { slug: "all", name_ar: "كل المنتجات", name_en: "All products" },
    ...familyNodes,
  ];
  const origins = [
    ...new Set(products.map(p => p.origin).filter(Boolean)),
  ] as string[];
  const selectedCategoryKeys =
    category === "all" ? null : descendants(tree ?? [], category);
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const result = products.filter(product => {
      if (selectedCategoryKeys) {
        const productCategoryKeys = [
          product.category?.slug,
          product.category?.id,
          product.category_id,
        ]
          .filter(value => value != null)
          .map(String);
        if (!productCategoryKeys.some(key => selectedCategoryKeys.has(key)))
          return false;
      }
      const name = String(
        lang === "ar" ? product.name_ar : product.name_en
      ).toLocaleLowerCase();
      return (
        (!q || name.includes(q)) &&
        Number(product.price || 0) <= priceMax &&
        (origin === "all" || product.origin === origin)
      );
    });
    if (sort === "price-asc")
      result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc")
      result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name")
      result.sort((a, b) =>
        String(lang === "ar" ? a.name_ar : a.name_en).localeCompare(
          String(lang === "ar" ? b.name_ar : b.name_en)
        )
      );
    return result;
  }, [lang, origin, priceMax, products, search, selectedCategoryKeys, sort]);
  const clear = () => {
    setSearch("");
    setOrigin("all");
    setSort("default");
    setPriceMax(maxPrice);
  };

  return (
    <Layout>
      <PageHero
        bgImage={productsHero}
        icon={<ShoppingBasket className="h-7 w-7" />}
        titleAr="كل المنتجات"
        titleEn="All products"
        subtitleAr="تسوّق تشكيلة كي دي دي من الألبان والعصائر والآيس كريم ومنتجات الطهي"
        subtitleEn="Shop KDD dairy, juices, ice cream and cooking products"
      />
      <div className="kdd-container py-8">
        <div className="mx-auto mb-6 flex max-w-2xl gap-2">
          <label className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-xl border border-border bg-secondary ps-10 pe-3 outline-none focus:border-primary"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t("products.search")}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowFilters(value => !value)}
            className={`rounded-xl border px-3 ${showFilters ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
            aria-label={lang === "ar" ? "الفلاتر" : "Filters"}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((item: any) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setCategory(item.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${category === item.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary"}`}
            >
              {lang === "ar" ? item.name_ar : item.name_en}
            </button>
          ))}
        </div>
        {showFilters && (
          <div className="mb-8 grid gap-5 rounded-2xl border border-border bg-secondary/40 p-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold">
                {lang === "ar" ? "السعر حتى" : "Price up to"}:{" "}
                {priceMax.toFixed(3)} {t("products.kwd")}
              </label>
              <input
                type="range"
                min="1"
                max={maxPrice}
                step="0.5"
                value={priceMax}
                onChange={event => setPriceMax(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold">
                {lang === "ar" ? "المصدر" : "Origin"}
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
                value={origin}
                onChange={event => setOrigin(event.target.value)}
              >
                <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
                {origins.map(value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold">
                {lang === "ar" ? "الترتيب" : "Sort"}
              </label>
              <select
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
                value={sort}
                onChange={event => setSort(event.target.value)}
              >
                <option value="default">
                  {lang === "ar" ? "الافتراضي" : "Default"}
                </option>
                <option value="price-asc">
                  {lang === "ar" ? "السعر الأقل" : "Price: low"}
                </option>
                <option value="price-desc">
                  {lang === "ar" ? "السعر الأعلى" : "Price: high"}
                </option>
                <option value="name">{lang === "ar" ? "الاسم" : "Name"}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 text-start text-sm font-bold text-primary hover:underline"
            >
              <X className="h-4 w-4" />
              {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </button>
          </div>
        )}
        {query.isLoading && !products.length ? (
          <LoadingState />
        ) : query.error && !products.length ? (
          <ErrorState message={query.error} />
        ) : !products.length ? (
          <EmptyState />
        ) : !filtered.length ? (
          <div className="kdd-status">
            {lang === "ar" ? "لا توجد منتجات مطابقة." : "No matching products."}
          </div>
        ) : (
          <>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {filtered.length} {lang === "ar" ? "منتج" : "products"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
