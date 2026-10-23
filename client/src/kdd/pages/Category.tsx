import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Layout from "@/kdd/components/Layout";
import ProductCard from "@/kdd/components/ProductCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/kdd/components/CatalogState";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import {
  useCategoryBySlug,
  useCategoryProducts,
  useCategoryTree,
} from "@/kdd/hooks/useStore";
import referenceSnapshot from "@/kdd/data/reference-layout.json";

const reference = referenceSnapshot as { categoryLinks: { slug: string }[] };

function findPath(nodes: any[], slug: string, trail: any[] = []): any[] | null {
  for (const node of nodes) {
    const path = [...trail, node];
    if (node.slug === slug) return path;
    if (node.children?.length) {
      const found = findPath(node.children, slug, path);
      if (found) return found;
    }
  }
  return null;
}

export default function Category() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const { data: tree } = useCategoryTree();
  const categoryQuery = useCategoryBySlug(slug);
  const productsQuery = useCategoryProducts(slug);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const path = useMemo(() => findPath(tree ?? [], slug) ?? [], [slug, tree]);
  const current = path[path.length - 1] as any;
  const products = (productsQuery.data ?? []) as any[];
  const countFor = (node: any) => {
    if (typeof node?.product_count === "number") return node.product_count;
    const collect = (item: any): any[] => [
      item,
      ...(item?.children ?? []).flatMap((child: any) => collect(child)),
    ];
    const nodes = collect(node);
    const ids = new Set(nodes.map(item => String(item.id)));
    return products.filter(
      product =>
        ids.has(String(product.category_id)) ||
        nodes.some(item => item.slug === product.category?.slug)
    ).length;
  };
  const childCategories = useMemo(() => {
    const order = new Map(
      reference.categoryLinks.map((item, index) => [item.slug, index])
    );
    return [...(current?.children ?? [])].sort(
      (a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)
    );
  }, [current]);
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const result = products.filter(product =>
      String(lang === "ar" ? product.name_ar : product.name_en)
        .toLocaleLowerCase()
        .includes(q)
    );
    if (sort === "price-asc")
      result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc")
      result.sort((a, b) => Number(b.price) - Number(a.price));
    return result;
  }, [lang, products, search, sort]);
  if (!slug || (!categoryQuery.isLoading && !categoryQuery.data))
    return (
      <Layout>
        <div className="kdd-container py-24 text-center">
          <h1 className="text-2xl font-black">
            {lang === "ar" ? "الفئة غير موجودة" : "Category not found"}
          </h1>
          <Link
            to="/"
            className="mt-4 inline-block text-primary hover:underline"
          >
            {lang === "ar" ? "العودة للرئيسية" : "Back home"}
          </Link>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="border-b border-border bg-secondary/40">
        <div className="kdd-container py-6">
          <nav className="mb-4 flex items-center gap-2 overflow-x-auto text-xs text-muted-foreground">
            <Link
              to="/"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" />
              {lang === "ar" ? "الرئيسية" : "Home"}
            </Link>
            {path.map((item: any, index) => (
              <span key={item.id ?? item.slug} className="whitespace-nowrap">
                /{" "}
                {index === path.length - 1 ? (
                  <strong className="text-foreground">
                    {lang === "ar" ? item.name_ar : item.name_en}
                  </strong>
                ) : (
                  <Link
                    className="hover:text-primary"
                    to={`/category/${item.slug}`}
                  >
                    {lang === "ar" ? item.name_ar : item.name_en}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <h1 className="text-3xl font-black md:text-5xl">
            {lang === "ar" ? current?.name_ar : current?.name_en}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {!productsQuery.isLoading &&
              `${filtered.length} ${lang === "ar" ? "منتج متوفر" : "products available"}`}
          </p>
        </div>
      </div>
      <div className="kdd-container py-7">
        {childCategories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to={`/category/${slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm sm:text-sm"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {lang === "ar" ? "كل المنتجات" : "All"}
              <span className="text-[10px] opacity-80">
                ({countFor(current)})
              </span>
            </Link>
            {childCategories.map((child: any) => (
              <Link
                key={child.id ?? child.slug}
                to={`/category/${child.slug}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground/80 transition-all hover:border-primary/50 hover:text-primary sm:text-sm"
              >
                {lang === "ar" ? child.name_ar : child.name_en}
                <span className="text-[10px] text-muted-foreground">
                  ({countFor(child)})
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="mx-auto mb-7 flex max-w-xl gap-2">
          <label className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-xl border border-border bg-secondary ps-9 pe-3 outline-none focus:border-primary"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={
                lang === "ar"
                  ? "ابحث في هذا القسم..."
                  : "Search this section..."
              }
            />
          </label>
          <select
            aria-label={lang === "ar" ? "الترتيب" : "Sort"}
            className="rounded-xl border border-border bg-background px-2 text-sm"
            value={sort}
            onChange={event => setSort(event.target.value)}
          >
            <option value="default">
              {lang === "ar" ? "الترتيب" : "Sort"}
            </option>
            <option value="price-asc">
              {lang === "ar" ? "الأقل سعراً" : "Price low"}
            </option>
            <option value="price-desc">
              {lang === "ar" ? "الأعلى سعراً" : "Price high"}
            </option>
          </select>
          <SlidersHorizontal className="hidden h-5 w-5 self-center text-muted-foreground sm:block" />
        </div>
        {productsQuery.isLoading && !products.length ? (
          <LoadingState />
        ) : productsQuery.error && !products.length ? (
          <ErrorState message={productsQuery.error} />
        ) : !products.length ? (
          <EmptyState detail />
        ) : !filtered.length ? (
          <div className="kdd-status">
            {lang === "ar" ? "لا توجد نتائج مطابقة." : "No matching products."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
