import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import HeroSlider from "@/kdd/components/HeroSlider";
import Layout from "@/kdd/components/Layout";
import ProductCard from "@/kdd/components/ProductCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/kdd/components/CatalogState";
import KddHighlights from "@/kdd/components/KddHighlights";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { useCategoryTree, useProducts } from "@/kdd/hooks/useStore";
import dairyHero from "@/kdd/assets/kdd-hero-dairy.jpg";
import juiceHero from "@/kdd/assets/kdd-hero-juice.jpg";
import iceCreamHero from "@/kdd/assets/kdd-hero-icecream.jpg";
import cookingHero from "@/kdd/assets/kdd-hero-cooking.jpg";
import referenceSnapshot from "@/kdd/data/reference-layout.json";

const FAMILY_HEROES: Record<string, string> = {
  "kdd-dairy": dairyHero,
  "kdd-juices": juiceHero,
  "kdd-icecream": iceCreamHero,
  "kdd-cooking": cookingHero,
};

const REFERENCE_CATEGORY_COUNTS: Record<string, number> = {
  "kdd-dairy": 34,
  "kdd-dairy-milks": 11,
  "kdd-dairy-fresh-dairy": 5,
  "kdd-dairy-flavoured-milks": 14,
  "kdd-dairy-kids-milks": 4,
  "kdd-juices": 38,
  "kdd-juices-100-per-juice": 10,
  "kdd-juices-flavored-beverage": 3,
  "kdd-juices-kids-juice": 6,
  "kdd-juices-nectars-drinks": 17,
  "kdd-juices-no-added-sugar-nectars": 2,
  "kdd-icecream": 69,
  "kdd-icecream-biscuits-cones": 3,
  "kdd-icecream-cones": 9,
  "kdd-icecream-cups": 12,
  "kdd-icecream-lolly": 7,
  "kdd-icecream-sandwich": 3,
  "kdd-icecream-softy": 2,
  "kdd-icecream-sticks": 18,
  "kdd-icecream-tubs": 15,
  "kdd-cooking": 18,
  "kdd-cooking-butter-oil": 4,
  "kdd-cooking-liquid-cream": 5,
  "kdd-cooking-sauce": 5,
  "kdd-cooking-thick-cream": 2,
  "kdd-cooking-tomato-paste": 2,
};

const REFERENCE_FAMILY_SECTIONS: Record<string, number> = {
  "kdd-dairy": 4,
  "kdd-juices": 5,
  "kdd-icecream": 8,
  "kdd-cooking": 5,
};

type AnyNode = Record<string, any>;

type LayoutIds = {
  familyOrder: string[];
  homeProductSections: Record<string, string[]>;
  categoryLinks: { slug: string }[];
  allProductOrder?: string[];
  categoryPreviewImages?: Record<string, string>;
};

const referenceLayout = referenceSnapshot as LayoutIds;

function descendants(node: AnyNode): AnyNode[] {
  return [
    node,
    ...(node.children ?? []).flatMap((child: AnyNode) => descendants(child)),
  ];
}

function countFor(node: AnyNode, products: AnyNode[]) {
  const referenceCount = REFERENCE_CATEGORY_COUNTS[node.slug];
  if (typeof referenceCount === "number") return referenceCount;
  if (typeof node.product_count === "number") return node.product_count;
  const ids = new Set(descendants(node).map(item => String(item.id)));
  return products.filter(product => {
    const categoryId =
      product.category_id == null ? "" : String(product.category_id);
    return ids.has(categoryId) || product.category?.slug === node.slug;
  }).length;
}

function orderedProducts(
  products: AnyNode[],
  ids: string[] | undefined,
  fallback: AnyNode[]
) {
  if (!ids?.length) return fallback.slice(0, 12);
  const byId = new Map(products.map(product => [String(product.id), product]));
  const selected = ids
    .map(id => byId.get(String(id)))
    .filter(Boolean) as AnyNode[];
  const selectedIds = new Set(selected.map(product => String(product.id)));
  return [
    ...selected,
    ...fallback.filter(product => !selectedIds.has(String(product.id))),
  ].slice(0, 12);
}

function ReferenceSectionHeader({
  children,
  to = "/products",
}: {
  children: ReactNode;
  to?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 border-b border-border pb-2">
      <h2 className="relative text-xl sm:text-2xl font-extrabold font-cairo text-foreground tracking-tight">
        {children}
        <span className="absolute -bottom-[9px] start-0 h-[3px] w-12 rounded-full bg-primary" />
      </h2>
      <Link
        to={to}
        className="text-xs sm:text-sm font-bold text-primary hover:underline whitespace-nowrap"
      >
        عرض الكل
      </Link>
    </div>
  );
}

function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    ref.current?.scrollBy({
      left: direction * Math.max(280, ref.current.clientWidth * 0.78),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${label} previous`}
        onClick={() => move(-1)}
        className="absolute start-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label={`${label} next`}
        onClick={() => move(1)}
        className="absolute end-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div
        ref={ref}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide px-1 pb-2"
      >
        {children}
      </div>
    </div>
  );
}

function ProductRail({
  products,
  label,
}: {
  products: AnyNode[];
  label: string;
}) {
  return (
    <Rail label={label}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className="snap-start shrink-0 w-[60%] sm:w-[40%] md:w-[28%] lg:w-[22%]"
        >
          <ProductCard product={product as any} index={index} />
        </div>
      ))}
    </Rail>
  );
}

export default function Index() {
  const { lang } = useLanguage();
  const productsQuery = useProducts("all");
  const { data: tree, isLoading: treeLoading } = useCategoryTree();
  const products = ((productsQuery.data ?? []) as AnyNode[]).filter(
    product => product.in_stock !== false
  );
  const section = (tree ?? []).find(node => node.slug === "section-kdd");

  const families = useMemo(() => {
    const direct = section?.children?.length
      ? section.children
      : (tree ?? []).filter(node =>
          ["kdd-dairy", "kdd-juices", "kdd-icecream", "kdd-cooking"].includes(
            node.slug
          )
        );
    const order = new Map(
      referenceLayout.familyOrder.map((slug, index) => [slug, index])
    );
    const leafOrder = new Map(
      referenceLayout.categoryLinks.map((item, index) => [item.slug, index])
    );
    return [...direct]
      .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
      .map(family => ({
        ...family,
        children: [...(family.children ?? [])].sort(
          (a, b) =>
            (leafOrder.get(a.slug) ?? 99) - (leafOrder.get(b.slug) ?? 99)
        ),
      }));
  }, [section, tree]);

  const [worldSlug, setWorldSlug] = useState("");
  const activeWorldSlug = worldSlug || families[0]?.slug || "kdd-dairy";

  const catalogOrder = useMemo(() => {
    const byId = new Map(
      products.map(product => [String(product.id), product])
    );
    const selected = (referenceLayout.allProductOrder ?? [])
      .map(id => byId.get(String(id)))
      .filter(Boolean) as AnyNode[];
    const selectedIds = new Set(selected.map(product => String(product.id)));
    return [
      ...selected,
      ...products.filter(product => !selectedIds.has(String(product.id))),
    ];
  }, [products]);

  const latestFallback = catalogOrder.slice(0, 12);
  const bestFallback = useMemo(() => {
    const explicit = catalogOrder.filter(product => product.featured);
    return (
      explicit.length
        ? explicit
        : catalogOrder.filter(
            product =>
              product.old_price &&
              Number(product.old_price) > Number(product.price)
          )
    ).slice(0, 12);
  }, [catalogOrder]);
  const latest = orderedProducts(
    products,
    referenceLayout.homeProductSections["وصل حديثاً"],
    latestFallback
  );
  const best = orderedProducts(
    products,
    referenceLayout.homeProductSections["الأكثر مبيعاً"],
    bestFallback.length ? bestFallback : catalogOrder
  );

  const familyProducts = (family: AnyNode) => {
    const fallback = products.filter(product =>
      descendants(family).some(
        category =>
          String(category.id) === String(product.category_id) ||
          category.slug === product.category?.slug
      )
    );
    const familyName = lang === "ar" ? family.name_ar : family.name_en;
    return orderedProducts(
      products,
      referenceLayout.homeProductSections[familyName] ??
        referenceLayout.homeProductSections[family.name_ar ?? ""],
      fallback
    );
  };

  return (
    <Layout>
      <HeroSlider />

      <main className="flex-1 font-cairo">
        <div className="container mx-auto px-3 sm:px-4">
          <section className="py-6 sm:py-8">
            <ReferenceSectionHeader>
              {lang === "ar" ? "تسوّق حسب الفئة" : "Shop by Category"}
            </ReferenceSectionHeader>

            {treeLoading && !families.length ? (
              <LoadingState />
            ) : families.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {families.map(family => {
                  const familyName =
                    lang === "ar" ? family.name_ar : family.name_en;
                  const familyStats = REFERENCE_FAMILY_SECTIONS[family.slug];
                  const children = family.children ?? [];
                  return (
                    <div
                      key={family.id}
                      className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
                    >
                      <Link
                        to={`/category/${family.slug}`}
                        className="group relative block h-36 sm:h-40 overflow-hidden"
                      >
                        <img
                          src={
                            family.image_url ||
                            FAMILY_HEROES[family.slug] ||
                            dairyHero
                          }
                          alt={familyName}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2">
                          <div>
                            <h3 className="font-cairo font-extrabold text-lg text-background leading-tight">
                              {familyName}
                            </h3>
                            <p className="text-[11px] text-background/80 tabular-nums">
                              {countFor(family, products)}{" "}
                              {lang === "ar" ? "منتج" : "products"} ·{" "}
                              {familyStats ?? children.length}{" "}
                              {lang === "ar" ? "أقسام" : "categories"}
                            </p>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                            <ArrowLeft className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>

                      <div className="grid grid-cols-2 gap-1.5 p-2">
                        {children.map((leaf: AnyNode) => (
                          <Link
                            key={leaf.id}
                            to={`/category/${leaf.slug}`}
                            className="group flex items-center gap-2 rounded-lg border border-border/60 bg-background p-1.5 hover:border-primary transition-colors"
                          >
                            <div className="w-10 h-10 shrink-0 rounded-md bg-secondary overflow-hidden flex items-center justify-center">
                              <img
                                alt=""
                                loading="lazy"
                                src={
                                  referenceLayout.categoryPreviewImages?.[
                                    leaf.slug
                                  ] ||
                                  leaf.image_url ||
                                  FAMILY_HEROES[family.slug] ||
                                  dairyHero
                                }
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {lang === "ar" ? leaf.name_ar : leaf.name_en}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                {countFor(leaf, products)}{" "}
                                {lang === "ar" ? "منتج" : "products"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          {productsQuery.isLoading && !products.length ? (
            <section className="py-6 sm:py-8">
              <LoadingState />
            </section>
          ) : productsQuery.error && !products.length ? (
            <section className="py-6 sm:py-8">
              <ErrorState message={productsQuery.error} />
            </section>
          ) : !products.length ? (
            <section className="py-6 sm:py-8">
              <EmptyState />
            </section>
          ) : (
            <>
              <section className="py-6 sm:py-8">
                <ReferenceSectionHeader>
                  {lang === "ar" ? "وصل حديثاً" : "New Arrivals"}
                </ReferenceSectionHeader>
                <ProductRail products={latest} label="new arrivals" />
              </section>

              <section className="py-6 sm:py-8">
                <ReferenceSectionHeader>
                  {lang === "ar" ? "الأكثر مبيعاً" : "Best Sellers"}
                </ReferenceSectionHeader>
                <ProductRail products={best} label="best sellers" />
              </section>
            </>
          )}
        </div>

        <KddHighlights />

        <section className="container mx-auto px-3 sm:px-4 py-12">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold">
            {lang === "ar" ? "عالم كي دي دي" : "The World of KDD"}
          </h2>
          <div className="mx-auto mt-2 mb-8 h-1 w-16 rounded-full bg-gold" />

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {families.map(family => (
              <button
                key={family.id}
                type="button"
                aria-selected={activeWorldSlug === family.slug}
                onClick={() => setWorldSlug(family.slug)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${activeWorldSlug === family.slug ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:border-primary/50 hover:text-primary"}`}
              >
                {lang === "ar" ? family.name_ar : family.name_en}
                <span className="ms-1 text-[11px] opacity-75">
                  ({countFor(family, products)})
                </span>
              </button>
            ))}
          </div>

          {families.map(family => {
            const familyName = lang === "ar" ? family.name_ar : family.name_en;
            const isActive = activeWorldSlug === family.slug;
            return (
              <div
                key={`world-panel-${family.id}`}
                id={`world-panel-${family.slug}`}
                hidden={!isActive}
                aria-hidden={!isActive}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-black">{familyName}</h3>
                  <Link
                    to={`/category/${family.slug}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {lang === "ar" ? "عرض الكل" : "View all"}
                  </Link>
                </div>
                <ProductRail
                  products={familyProducts(family)}
                  label={`KDD ${familyName}`}
                />
              </div>
            );
          })}
        </section>
      </main>
    </Layout>
  );
}
