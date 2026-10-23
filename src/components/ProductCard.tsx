import SalePrice from '@/components/SalePrice';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { DbProduct } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Sparkles, Heart, GitCompare, Zap } from 'lucide-react';
import BrandedImage from '@/components/BrandedImage';
import { useWishlist } from '@/hooks/useWishlist';
import StockAlertForm from '@/components/StockAlertForm';
import { useCompare } from '@/hooks/useCompare';
import QuickShopDrawer from '@/components/QuickShopDrawer';

interface ProductCardProps { product: DbProduct; index?: number }

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { has: isWished, toggle: toggleWish } = useWishlist();
  const { has: isCompared, toggle: toggleCompare } = useCompare();
  const [justAdded, setJustAdded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const hasDiscount = true;
  const discountPercent = 50;

  const handleAdd = () => {
    if (!Number.isFinite(Number(product.price)) || product.price <= 0) return;
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <>
      <div
        className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 flex flex-col"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Top action chips */}
        <div className="absolute top-2.5 end-2.5 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label={lang === 'ar' ? 'أضف للمفضلة' : 'Add to wishlist'}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(product.id); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all active:scale-90 ${
              isWished(product.id) ? 'bg-rose-500 text-white' : 'bg-card/95 text-foreground hover:bg-rose-500 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWished(product.id) ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            aria-label={lang === 'ar' ? 'أضف للمقارنة' : 'Add to compare'}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product.id, lang); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all active:scale-90 ${
              isCompared(product.id) ? 'bg-primary text-primary-foreground' : 'bg-card/95 text-foreground hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top-left badges */}
        <div className="absolute top-2.5 start-2.5 z-20 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md tabular-nums">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-md">
              <Sparkles className="w-2.5 h-2.5" />
              {lang === 'ar' ? 'مميز' : 'Featured'}
            </span>
          )}
        </div>

        {/* Studio image */}
        <Link to={`/product/${product.id}`} className="block relative">
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-100 dark:via-white dark:to-slate-200">
            <BrandedImage
              src={product.image_url || '/placeholder.svg'}
              alt={name}
              className="w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
              lang={lang}
              isAiGenerated={(product as any).is_ai_generated_image ?? false}
            />

            {/* Origin chip on image */}
            {product.origin && (
              <span className="absolute bottom-2 start-2 bg-foreground/85 backdrop-blur-md text-background text-[10px] font-cairo font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
                {product.origin}
              </span>
            )}

            {/* Low stock */}
            {product.in_stock && (product as any).stock_quantity != null && (product as any).stock_quantity > 0 && (product as any).stock_quantity <= ((product as any).low_stock_threshold || 5) && (
              <span className="absolute bottom-2 end-2 bg-orange-500 text-white text-[10px] font-cairo font-extrabold px-2 py-0.5 rounded-md shadow-md animate-pulse">
                🔥 {lang === 'ar' ? `بقي ${(product as any).stock_quantity}` : `Only ${(product as any).stock_quantity}`}
              </span>
            )}

            {/* Out of stock */}
            {!product.in_stock && (
              <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-destructive text-destructive-foreground px-4 py-1.5 rounded-xl font-bold font-cairo text-xs shadow-xl">
                  {t('products.outOfStock')}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          <Link to={`/product/${product.id}`} className="flex-1">
            <h3 className="font-cairo font-bold text-foreground group-hover:text-primary transition-colors text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
              {name}
            </h3>
          </Link>

          {/* Price row */}
          <SalePrice price={product.price} className="text-sm" />

          {/* Actions: Quick Shop + Add */}
          {product.in_stock ? (
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
                aria-label={lang === 'ar' ? 'شراء سريع' : 'Quick Shop'}
                className="col-span-2 h-9 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary/40 text-foreground text-xs font-cairo font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'سريع' : 'Quick'}</span>
              </button>
              <Button
                onClick={handleAdd}
                size="sm"
                disabled={!Number.isFinite(Number(product.price)) || product.price <= 0}
                className={`col-span-3 h-9 rounded-lg font-cairo text-xs gap-1 transition-all active:scale-95 ${
                  justAdded ? 'bg-green-600 hover:bg-green-600' : ''
                }`}
              >
                {justAdded ? (
                  <><Check className="w-3.5 h-3.5" /> {lang === 'ar' ? 'تمت!' : 'Added!'}</>
                ) : (
                  <><ShoppingCart className="w-3.5 h-3.5" /> {t('products.addToCart')}</>
                )}
              </Button>
            </div>
          ) : (
            <StockAlertForm productId={product.id} variant="card" />
          )}
        </div>
      </div>

      <QuickShopDrawer product={product} open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
};

export default ProductCard;
