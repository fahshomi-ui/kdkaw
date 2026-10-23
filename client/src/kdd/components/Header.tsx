import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  GitCompare,
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import { useCart } from "@/kdd/contexts/CartContext";
import { useCategoryTree, useProducts } from "@/kdd/hooks/useStore";
import type { CategoryNode, DbProduct } from "@/kdd/lib/types";
import logoLight from "@/kdd/assets/makani-foods-logo.png";
import referenceSnapshot from "@/kdd/data/reference-layout.json";
import LocalCollectionPanel from "@/kdd/components/LocalCollectionPanel";
import { useCompare, useWishlist } from "@/kdd/hooks/useLocalCollections";

type AnyProduct = DbProduct;
const referenceLayout = referenceSnapshot as {
  familyOrder: string[];
  categoryLinks: { slug: string }[];
};

function labelFor(node: CategoryNode, lang: "ar" | "en") {
  return lang === "ar" ? node.name_ar : node.name_en;
}

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { totalItems } = useCart();
  const { data: tree } = useCategoryTree();
  const { data: allProducts } = useProducts("all");
  const { pathname } = useLocation();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState(false);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelMenuClose = useCallback(() => {
    if (menuCloseTimer.current !== null) {
      clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
  }, []);
  const openProductsMenu = useCallback(() => {
    cancelMenuClose();
    setOpenSection(true);
  }, [cancelMenuClose]);
  const scheduleMenuClose = useCallback(() => {
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => {
      setOpenSection(false);
      menuCloseTimer.current = null;
    }, 180);
  }, [cancelMenuClose]);
  useEffect(() => cancelMenuClose, [cancelMenuClose]);
  const [localPanel, setLocalPanel] = useState<"wishlist" | "compare" | null>(
    null
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    cancelMenuClose();
    setMobileOpen(false);
    setOpenSection(false);
    setLocalPanel(null);
    setNotificationsOpen(false);
  }, [pathname, cancelMenuClose]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("kdd-theme-v1");
      if (saved) {
        document.documentElement.classList.toggle("dark", saved === "dark");
        setDark(saved === "dark");
      }
    } catch {
      /* Optional local appearance preference. */
    }
  }, []);

  const products = (allProducts ?? []) as AnyProduct[];
  const wishlistProducts = useMemo(
    () =>
      wishlist.ids
        .map(id => products.find(product => String(product.id) === id))
        .filter(Boolean) as AnyProduct[],
    [products, wishlist.ids]
  );
  const compareProducts = useMemo(
    () =>
      compare.ids
        .map(id => products.find(product => String(product.id) === id))
        .filter(Boolean) as AnyProduct[],
    [compare.ids, products]
  );
  const section = useMemo(
    () => (tree ?? []).find(node => node.slug === "section-kdd") ?? null,
    [tree]
  );
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
  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg shadow-primary/10">
      <div className="hidden border-b border-primary-foreground/10 bg-primary/90 text-[11px] text-primary-foreground/70 md:flex">
        <div className="kdd-container flex h-8 items-center justify-between">
          <span>
            {lang === "ar"
              ? "🚚 التوصيل مجاني لجميع مناطق الكويت"
              : "🚚 Free delivery across Kuwait"}
          </span>
          <span>
            {lang === "ar"
              ? "مرحباً بك في كي دي دي — ألبان وعصائر وآيس كريم منذ 1962"
              : "Welcome to KDD — dairy, juices & ice cream since 1962"}
          </span>
        </div>
      </div>

      <div className="kdd-container flex h-16 items-center justify-between gap-2">
        <Link
          to="/"
          className="group flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5"
          aria-label="KDD"
        >
          <span className="relative block shrink-0">
            <img
              src={logoLight}
              alt="KDD"
              className="h-10 w-12 object-contain transition-all duration-300 sm:h-12 sm:w-14"
            />
            <span className="absolute -bottom-0.5 -end-0.5 h-2 w-2 rounded-full border-2 border-primary bg-green-400 sm:h-2.5 sm:w-2.5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="whitespace-nowrap text-xs font-black text-primary-foreground sm:text-sm md:text-base">
              {lang === "ar" ? "كي دي دي" : "KDD"}
            </span>
            <span className="hidden truncate text-[10px] text-primary-foreground/60 md:inline">
              {lang === "ar"
                ? "ألبان وعصائر وآيس كريم منذ 1962"
                : "Dairy, Juices & Ice Cream since 1962"}
            </span>
          </span>
        </Link>

        <nav className="hidden self-stretch items-center gap-1 md:flex">
          <Link
            to="/"
            className={`kdd-nav-link ${pathname === "/" ? "kdd-nav-link-active" : ""}`}
          >
            {t("nav.home")}
          </Link>
          <div
            className="static flex h-full items-center"
            onMouseEnter={openProductsMenu}
            onMouseLeave={scheduleMenuClose}
            onFocus={openProductsMenu}
            onBlur={event => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null
                )
              ) {
                scheduleMenuClose();
              }
            }}
          >
            <Link
              to="/category/section-kdd"
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                openSection || isActive("/category/section-kdd")
                  ? "bg-primary-foreground/15 font-bold text-primary-foreground"
                  : "text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              }`}
              aria-haspopup="true"
              aria-expanded={openSection}
            >
              <Sun className="h-4 w-4" />
              {lang === "ar" ? "منتجات كي دي دي" : "KDD Products"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${openSection ? "rotate-180" : ""}`}
              />
            </Link>
            <div
              data-testid="kdd-products-mega-menu"
              onMouseEnter={openProductsMenu}
              onMouseLeave={scheduleMenuClose}
              className={`absolute inset-x-0 top-full flex justify-center pt-3 transition-all duration-200 ${
                openSection
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-2 opacity-0 pointer-events-none"
              }`}
            >
              <div className="w-[min(95vw,980px)] rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl shadow-foreground/15">
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                  <h3 className="text-lg font-cairo font-black text-foreground leading-tight">
                    {lang === "ar" ? "منتجات كي دي دي" : "KDD Products"}
                  </h3>
                  <Link
                    to="/category/section-kdd"
                    onClick={() => setOpenSection(false)}
                    className="whitespace-nowrap text-xs font-bold text-primary hover:underline"
                  >
                    {lang === "ar" ? "تسوّق الكل ←" : "Shop All →"}
                  </Link>
                </div>
                <div
                  data-testid="kdd-products-menu-grid"
                  className="grid max-h-[min(60vh,240px)] grid-cols-2 gap-x-6 gap-y-5 overflow-y-scroll md:grid-cols-4"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor:
                      "hsl(var(--primary) / 0.3) hsl(var(--muted) / 0.5)",
                  }}
                >
                  {families.map(family => (
                    <div key={family.id} className="min-w-0">
                      <Link
                        to={`/category/${family.slug}`}
                        onClick={() => setOpenSection(false)}
                        className="mb-2 block text-sm font-cairo font-extrabold text-foreground hover:text-primary transition-colors"
                      >
                        <span>{labelFor(family, lang)}</span>
                      </Link>
                      <ul className="space-y-1.5">
                        {(family.children ?? []).map(leaf => (
                          <li key={leaf.id}>
                            <Link
                              to={`/category/${leaf.slug}`}
                              onClick={() => setOpenSection(false)}
                              className="flex items-center justify-between gap-2 text-[12.5px] font-cairo text-muted-foreground transition-all hover:-translate-x-0.5 hover:text-primary rtl:hover:translate-x-0.5"
                            >
                              <span>{labelFor(leaf, lang)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Link
            to="/products"
            className={`kdd-nav-link ${pathname === "/products" ? "kdd-nav-link-active" : ""}`}
          >
            {lang === "ar" ? "كل المنتجات" : "All Products"}
          </Link>
        </nav>

        <div className="relative flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden items-center overflow-hidden rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 md:flex">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1.5 text-[11px] font-bold transition-all ${lang === "en" ? "bg-primary-foreground text-primary" : "text-primary-foreground/60 hover:text-primary-foreground"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("ar")}
              className={`px-2.5 py-1.5 text-[11px] font-bold transition-all ${lang === "ar" ? "bg-primary-foreground text-primary" : "text-primary-foreground/60 hover:text-primary-foreground"}`}
            >
              عربي
            </button>
          </div>
          <Link
            to="/products"
            aria-label={lang === "ar" ? "بحث" : "Search"}
            className="kdd-icon-button"
          >
            <Search className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="kdd-icon-button"
            aria-label={lang === "ar" ? "تغيير المظهر" : "Toggle theme"}
            onClick={() => {
              const next = !dark;
              setDark(next);
              document.documentElement.classList.toggle("dark", next);
              try {
                window.localStorage.setItem(
                  "kdd-theme-v1",
                  next ? "dark" : "light"
                );
              } catch {
                /* Optional storage. */
              }
            }}
          >
            {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            type="button"
            aria-label={lang === "ar" ? "المفضلة" : "Wishlist"}
            className="kdd-icon-button hidden sm:flex"
            onClick={() =>
              setLocalPanel(localPanel === "wishlist" ? null : "wishlist")
            }
          >
            <Heart className="h-5 w-5" />
            {wishlist.count > 0 && (
              <span className="kdd-count-badge">{wishlist.count}</span>
            )}
          </button>
          {compare.count > 0 && (
            <button
              type="button"
              aria-label={lang === "ar" ? "المقارنة" : "Compare"}
              className="kdd-icon-button hidden sm:flex"
              onClick={() =>
                setLocalPanel(localPanel === "compare" ? null : "compare")
              }
            >
              <GitCompare className="h-5 w-5" />
              {compare.count > 0 && (
                <span className="kdd-count-badge">{compare.count}</span>
              )}
            </button>
          )}
          <Link
            to="/cart"
            aria-label={t("nav.cart")}
            className="kdd-icon-button relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="kdd-count-badge">{totalItems}</span>
            )}
          </Link>
          <button
            type="button"
            className="kdd-icon-button"
            aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen(value => !value)}
          >
            <Bell className="h-5 w-5" />
          </button>
          {notificationsOpen && (
            <div className="absolute end-0 top-12 z-[60] w-64 rounded-2xl border border-border bg-card p-5 text-center text-xs text-muted-foreground shadow-xl">
              {lang === "ar"
                ? "لا توجد إشعارات محلية."
                : "No local notifications."}
            </div>
          )}
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            aria-label={lang === "ar" ? "English" : "العربية"}
            className="kdd-mobile-language md:hidden"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(value => !value)}
            aria-label={lang === "ar" ? "فتح القائمة" : "Open menu"}
            className="kdd-icon-button md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          {localPanel === "wishlist" && (
            <LocalCollectionPanel
              kind="wishlist"
              products={wishlistProducts}
              lang={lang}
              onRemove={wishlist.remove}
              onClose={() => setLocalPanel(null)}
            />
          )}
          {localPanel === "compare" && (
            <LocalCollectionPanel
              kind="compare"
              products={compareProducts}
              lang={lang}
              onRemove={compare.remove}
              onClose={() => setLocalPanel(null)}
            />
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-primary-foreground/10 bg-background text-foreground md:hidden">
          <nav className="kdd-container max-h-[75vh] overflow-y-auto py-3">
            <Link
              to="/"
              className="kdd-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/category/section-kdd"
              className="kdd-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {lang === "ar" ? "منتجات كي دي دي" : "KDD Products"}
            </Link>
            <div className="grid gap-2 rounded-2xl bg-muted/40 p-3">
              {families.map(family => (
                <div key={family.id}>
                  <Link
                    to={`/category/${family.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-1.5 text-sm font-extrabold"
                  >
                    <span>{labelFor(family, lang)}</span>
                  </Link>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-s-2 border-primary/15 ps-3">
                    {(family.children ?? []).map(leaf => (
                      <Link
                        key={leaf.id}
                        to={`/category/${leaf.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between gap-1 py-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <span>{labelFor(leaf, lang)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/products"
              className="kdd-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {lang === "ar" ? "كل المنتجات" : "All Products"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
