import SalePrice from '@/components/SalePrice';
import { Link } from 'react-router-dom';
import { GitCompare, X, ShoppingCart, Check, Minus, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useStore';
import { useProductRating } from '@/hooks/useReviews';
import BrandedImage from '@/components/BrandedImage';
import { Skeleton } from '@/components/ui/skeleton';

const RatingCell = ({ productId }: { productId: string }) => {
  const { avg, count } = useProductRating(productId);
  if (count === 0) return <span className="text-xs text-muted-foreground font-cairo">—</span>;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3 h-3 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground font-cairo">({count})</span>
    </div>
  );
};

const Compare = () => {
  const { lang, t } = useLanguage();
  const { ids, remove, clear } = useCompare();
  const { addItem } = useCart();
  const { data: products, isLoading } = useProducts();
  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  const items = (products || []).filter((p) => ids.includes(p.id));

  const rows: { key: string; label: string; render: (p: typeof items[number]) => React.ReactNode }[] = [
    {
      key: 'price',
      label: lang === 'ar' ? 'السعر' : 'Price',
      render: (p) => (
        <SalePrice price={p.price} className="text-lg justify-center" />
      ),
    },
    {
      key: 'weight',
      label: lang === 'ar' ? 'الوزن' : 'Weight',
      render: (p) => <span className="font-cairo text-xs text-foreground">{p.weight || '—'}</span>,
    },
    {
      key: 'origin',
      label: lang === 'ar' ? 'المنشأ' : 'Origin',
      render: (p) => <span className="font-cairo text-xs text-foreground">{p.origin || '—'}</span>,
    },
    {
      key: 'category',
      label: lang === 'ar' ? 'الفئة' : 'Category',
      render: (p) => (
        <span className="font-cairo text-xs text-foreground">
          {p.category ? (lang === 'ar' ? p.category.name_ar : p.category.name_en) : '—'}
        </span>
      ),
    },
    {
      key: 'rating',
      label: lang === 'ar' ? 'التقييم' : 'Rating',
      render: (p) => <RatingCell productId={p.id} />,
    },
    {
      key: 'stock',
      label: lang === 'ar' ? 'التوفّر' : 'Availability',
      render: (p) =>
        p.in_stock ? (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-cairo text-xs font-bold">
            <Check className="w-3.5 h-3.5" /> {lang === 'ar' ? 'متوفر' : 'In Stock'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-destructive font-cairo text-xs font-bold">
            <Minus className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نفد' : 'Out'}
          </span>
        ),
    },
    {
      key: 'featured',
      label: lang === 'ar' ? 'مميز' : 'Featured',
      render: (p) =>
        p.featured ? (
          <Check className="w-4 h-4 text-amber-500 mx-auto" />
        ) : (
          <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />
        ),
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <Link to="/products" className="text-muted-foreground hover:text-primary transition">
              <BackArrow className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-cairo font-black text-2xl sm:text-3xl text-foreground flex items-center gap-2">
                <GitCompare className="w-6 h-6 text-primary" />
                {lang === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-cairo mt-1">
                {lang === 'ar'
                  ? `${items.length} منتجات في المقارنة`
                  : `${items.length} products in comparison`}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear} className="font-cairo text-xs">
              {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <Skeleton className="w-full h-52 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border">
            <GitCompare className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-cairo font-bold text-lg text-foreground mb-2">
              {lang === 'ar' ? 'لا توجد منتجات للمقارنة' : 'No products to compare'}
            </h2>
            <p className="text-sm text-muted-foreground font-cairo mb-6">
              {lang === 'ar'
                ? 'أضف منتجين أو أكثر من قائمة المنتجات'
                : 'Add 2 or more products from the catalog'}
            </p>
            <Link to="/products">
              <Button className="font-cairo">
                {lang === 'ar' ? 'تصفّح المنتجات' : 'Browse Products'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full min-w-[600px] border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="text-start font-cairo text-xs font-bold text-muted-foreground w-28 sticky start-0 bg-background z-10">
                    {lang === 'ar' ? 'الخاصية' : 'Attribute'}
                  </th>
                  {items.map((p) => (
                    <th key={p.id} className="p-2 align-top">
                      <div className="bg-card border border-border rounded-2xl p-3 relative w-44 mx-auto">
                        <button
                          onClick={() => remove(p.id)}
                          aria-label="remove"
                          className="absolute top-1.5 end-1.5 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <Link to={`/product/${p.id}`}>
                          <BrandedImage
                            src={p.image_url || '/placeholder.svg'}
                            alt={lang === 'ar' ? p.name_ar : p.name_en}
                            className="w-full h-28 object-cover rounded-xl mb-2"
                            lang={lang}
                            isAiGenerated={(p as any).is_ai_generated_image ?? false}
                          />
                          <h3 className="font-cairo font-extrabold text-xs text-foreground line-clamp-2 min-h-[2rem] text-center hover:text-primary transition">
                            {lang === 'ar' ? p.name_ar : p.name_en}
                          </h3>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className="font-cairo text-xs font-bold text-muted-foreground py-2 sticky start-0 bg-background z-10">
                      {row.label}
                    </td>
                    {items.map((p) => (
                      <td key={p.id} className="text-center bg-muted/30 rounded-xl py-3 px-2">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky start-0 bg-background z-10"></td>
                  {items.map((p) => (
                    <td key={p.id} className="text-center py-2 px-2">
                      <Button
                        size="sm"
                        disabled={!p.in_stock}
                        onClick={() => addItem(p, 1)}
                        className="w-full font-cairo text-xs gap-1.5 h-9 rounded-xl"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'أضف' : 'Add'}
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Compare;
