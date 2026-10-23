import { getProductPricing, PRODUCT_DISCOUNT_PERCENT } from '@/lib/pricing';
import SalePrice from '@/components/SalePrice';
import { useParams, Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useProduct, useProducts, useProductImages, useCategories } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Minus, Plus, ArrowLeft, ArrowRight, Weight, MapPin, Fish, Snowflake, Check, X, Truck, Shield, Clock, Scissors, Flame, Package, ChevronLeft, ChevronRight, Flower2, Sparkles, Leaf, Egg, Sliders } from 'lucide-react';
import Layout from '@/components/Layout';
import BrandedImage from '@/components/BrandedImage';


import RelatedProducts from '@/components/RelatedProducts';
import StockAlertForm from '@/components/StockAlertForm';
import RecentlyViewedStrip from '@/components/RecentlyViewedStrip';
import SEO from '@/components/SEO';
import { useState, useRef, useEffect } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { getPrepGroups, getPrepFeesForItem, type PrepIcon } from '@/lib/preparations';

const PREP_ICON_MAP: Record<PrepIcon, React.ComponentType<{ className?: string }>> = {
  scissors: Scissors,
  flame: Flame,
  package: Package,
  snowflake: Snowflake,
  flower: Flower2,
  spice: Sparkles,
  leaf: Leaf,
  fish: Fish,
  egg: Egg,
};

const ProductDetail = () => {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedPreps, setSelectedPreps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const { data: product, isLoading } = useProduct(id || '');
  const { data: productImages } = useProductImages(id || '');
  const { data: allProducts } = useProducts();
  const { data: allCategories } = useCategories();
  const { track } = useRecentlyViewed();

  useEffect(() => {
    if (id) track(id);
  }, [id, track]);

  const scrollRelated = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  if (isLoading) return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[450px] rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!product) return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center font-cairo text-lg text-muted-foreground">
        {lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'}
      </div>
    </Layout>
  );

  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const desc = lang === 'ar' ? product.description_ar : product.description_en;
  const categoryName = product.category ? (lang === 'ar' ? product.category.name_ar : product.category.name_en) : '';
  const hasDiscount = true;
  const discountPercent = PRODUCT_DISCOUNT_PERCENT;
  const related = (allProducts || []).filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 10);
  // Gallery: only real product images
  const productImageUrls = (productImages && productImages.length > 0)
    ? productImages.map(pi => pi.image_url)
    : [product.image_url || '/placeholder.svg'];
  const images: { src: string; captionAr?: string; captionEn?: string; isContext?: boolean }[] =
    productImageUrls.map(src => ({ src }));

  return (
    <Layout>
      <SEO
        title={`${lang === 'ar' ? product.name_ar : product.name_en} — KDCow`}
        description={lang === 'ar' ? (product.description_ar || product.name_ar) : (product.description_en || product.name_en)}
        image={product.image_url || undefined}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: lang === 'ar' ? product.name_ar : product.name_en,
          image: product.image_url,
          description: lang === 'ar' ? product.description_ar : product.description_en,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'KWD',
            price: getProductPricing(product.price).unitPrice.toFixed(3),
            availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }}
      />
      <div className="container mx-auto px-4 py-4 md:py-10 pb-24 md:pb-10 bg-background">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-cairo mb-4 md:mb-8 uppercase tracking-wider">
          <Link to="/" className="hover:text-primary transition-colors font-semibold">{lang === 'ar' ? 'الرئيسية' : 'HOME'}</Link>
          {categoryName && <><span>/</span><Link to={`/category/${product.category?.slug}`} className="hover:text-primary transition-colors">{categoryName}</Link></>}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-start">
          {/* Image Gallery — clean, no card, makanifoods style */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-lg overflow-hidden">
              <BrandedImage
                src={images[activeThumb]?.src || '/placeholder.svg'}
                alt={name}
                className="w-full h-72 sm:h-96 md:h-[520px] object-contain p-4 md:p-8"
                size="lg"
                isAiGenerated={(product as any).is_ai_generated_image ?? false}
              />
              {hasDiscount && (
                <div className="absolute top-4 start-4">
                  <Badge className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                    -{discountPercent}%
                  </Badge>
                </div>
              )}
              {!product.in_stock && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Badge variant="destructive" className="text-base px-6 py-2 font-cairo">
                    {t('products.outOfStock')}
                  </Badge>
                </div>
              )}
              {/* Side arrows for gallery */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveThumb((activeThumb - 1 + images.length) % images.length)}
                    className="absolute start-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-foreground/70 hover:text-primary transition-all"
                    aria-label="previous"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button
                    onClick={() => setActiveThumb((activeThumb + 1) % images.length)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-foreground/70 hover:text-primary transition-all"
                    aria-label="next"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    aria-label={`image ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      activeThumb === i ? 'w-8 bg-primary' : 'w-1.5 bg-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info — makanifoods clean style */}
          <div className="space-y-5">
            {/* Vendor / Brand */}
            {(product as any).vendor || categoryName ? (
              <div className="text-xs md:text-sm font-cairo font-bold tracking-widest uppercase text-primary border-b-2 border-primary inline-block pb-1">
                {(product as any).vendor || categoryName}
              </div>
            ) : null}

            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold font-cairo text-foreground leading-tight">
              {name}
            </h1>

            {/* Price */}
            <SalePrice price={product.price} className="text-xl md:text-2xl" />

            {/* Average weight / origin meta */}
            {product.weight && (
              <p className="text-sm font-cairo text-foreground">
                <span className="font-bold">{lang === 'ar' ? 'الوزن:' : 'Average Weight:'}</span>{' '}
                <span className="text-muted-foreground">{product.weight}</span>
              </p>
            )}

            {/* Info banner — light gray rounded, like makanifoods */}
            <div className="rounded-2xl bg-muted/60 border border-border/50 px-4 py-3.5">
              <p className="text-xs md:text-sm font-cairo text-foreground/80 italic leading-relaxed">
                {lang === 'ar'
                  ? `سعر الوحدة ${getProductPricing(product.price).unitPrice.toFixed(3)} د.ك. سيتم إصدار استرداد لأي فرق في السعر بناءً على الوزن الصافي للمنتج تلقائياً.`
                  : `The unit price is ${getProductPricing(product.price).unitPrice.toFixed(3)} KD. A refund for any price difference, based on the item's net weight, will be issued automatically.`}
              </p>
            </div>

            {/* Pack Type pills */}
            <div className="space-y-2">
              <label className="block font-cairo font-bold text-foreground text-sm">
                {lang === 'ar' ? 'نوع التعبئة' : 'Pack Type'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-5 py-2 rounded-full border-2 border-foreground bg-background text-foreground font-cairo font-bold text-sm hover:bg-foreground hover:text-background transition-colors"
                >
                  {product.weight || (lang === 'ar' ? 'قطعة' : '1 Piece')}
                </button>
              </div>
            </div>

            {/* Quantity + Add to Cart — full width, makanifoods red pill */}
            <div className="space-y-3 pt-2">
              <label className="block font-cairo font-bold text-foreground text-sm">{t('products.quantity')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center justify-between border-2 border-border rounded-full overflow-hidden bg-background w-full sm:w-36 h-14">
                  <button
                    type="button"
                    className="w-12 h-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-cairo font-extrabold text-foreground text-lg">{qty}</span>
                  <button
                    type="button"
                    className="w-12 h-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                    onClick={() => setQty(qty + 1)}
                    aria-label="increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!product.in_stock}
                  onClick={() => addItem(product, qty, selectedPreps.length > 0 ? selectedPreps : undefined)}
                  className="hidden md:flex flex-1 items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-cairo font-extrabold text-base rounded-full h-14 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 hover:scale-[1.01]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.in_stock ? t('products.addToCart') : t('products.outOfStock')}
                </button>
              </div>
              {!product.in_stock && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <StockAlertForm productId={product.id} variant="inline" />
                </div>
              )}
            </div>

            {/* Description accordion — makanifoods style */}
            <Accordion type="single" collapsible defaultValue="desc" className="w-full border-t border-border pt-2">
              <AccordionItem value="desc" className="border-b border-border">
                <AccordionTrigger className="font-cairo font-extrabold text-foreground text-base md:text-lg hover:no-underline py-4">
                  {lang === 'ar' ? 'الوصف' : 'Description'}
                </AccordionTrigger>
                <AccordionContent className="pb-5 space-y-4">
                  {product.origin && (
                    <div className="flex items-center gap-2 text-sm font-cairo text-foreground">
                      <MapPin className="w-4 h-4 text-foreground" />
                      <span className="font-bold">{product.origin}</span>
                    </div>
                  )}
                  {desc && (
                    <div className="space-y-3">
                      <h3 className="font-cairo font-extrabold text-foreground text-lg md:text-xl leading-snug">
                        {lang === 'ar' ? `استمتع بنكهة ${name} الغنية` : `Indulge in the Juicy and Flavorful ${name}`}
                      </h3>
                      <p className="text-sm md:text-base font-cairo text-muted-foreground leading-relaxed whitespace-pre-line">
                        {desc}
                      </p>
                    </div>
                  )}
                  {/* meta chips */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-cairo bg-muted/60 border border-border rounded-full px-3 py-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-foreground">
                        {(product.category?.slug?.includes('frozen') || product.category?.slug?.includes('icecream')) ? (lang === 'ar' ? 'مجمد' : 'Frozen') : (lang === 'ar' ? 'طازج' : 'Fresh')}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-cairo bg-muted/60 border border-border rounded-full px-3 py-1.5">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-foreground">{lang === 'ar' ? 'توصيل مجاني لجميع مناطق الكويت' : 'Free delivery across Kuwait'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-cairo bg-muted/60 border border-border rounded-full px-3 py-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-foreground">{lang === 'ar' ? 'جودة مضمونة' : 'Quality Assured'}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-cairo font-bold px-3 py-1.5 rounded-full border ${
                      product.in_stock
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                        : 'bg-destructive/10 text-destructive border-destructive/30'
                    }`}>
                      {product.in_stock ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {product.in_stock ? (lang === 'ar' ? 'متوفر' : 'In Stock') : t('products.outOfStock')}
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* قسم الخيارات — Accordion (preserved) */}
            {(() => {
              const subSlug = product.category?.slug;
              const subCat = (allCategories || []).find((c: any) => c.slug === subSlug);
              const parentCat = subCat?.parent_id
                ? (allCategories || []).find((c: any) => c.id === subCat.parent_id)
                : null;
              const groups = getPrepGroups(subSlug, parentCat?.slug);
              if (!groups || groups.length === 0) return null;

              const togglePrep = (id: string) => {
                setSelectedPreps(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
              };
              const totalFees = getPrepFeesForItem(selectedPreps, 1);
              const selectedCount = selectedPreps.length;

              return (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="customize" className="border-b border-border">
                    <AccordionTrigger className="font-cairo font-extrabold text-foreground text-base md:text-lg hover:no-underline py-4">
                      <div className="flex items-center gap-2 flex-1 text-start">
                        <Sliders className="w-5 h-5 text-primary" />
                        <span>{lang === 'ar' ? 'خصّص طلبك' : 'Customize Your Order'}</span>
                        {selectedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-cairo font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {selectedCount}{totalFees > 0 && ` • +${totalFees.toFixed(3)}`}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <div className="space-y-4 pt-1">
                        {groups.map(group => (
                          <div key={group.id} className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-cairo font-bold text-foreground text-xs md:text-sm">
                                {lang === 'ar' ? group.titleAr : group.titleEn}
                              </span>
                              {(group.noteAr || group.noteEn) && (
                                <span className="text-[10px] text-muted-foreground font-cairo bg-muted/60 px-2 py-0.5 rounded-md">
                                  {lang === 'ar' ? group.noteAr : group.noteEn}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.options.map(prep => {
                                const isSelected = selectedPreps.includes(prep.id);
                                const isFree = prep.price === 0;
                                const Icon = PREP_ICON_MAP[prep.icon] || Scissors;
                                return (
                                  <button
                                    key={prep.id}
                                    type="button"
                                    onClick={() => togglePrep(prep.id)}
                                    aria-pressed={isSelected}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-xs md:text-sm font-cairo font-medium transition-all ${
                                      isSelected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background text-foreground/70 hover:border-foreground/40'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <span>{lang === 'ar' ? prep.labelAr : prep.labelEn}</span>
                                    <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      isFree
                                        ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                        : isSelected ? 'bg-primary/20 text-primary' : 'bg-foreground/5 text-muted-foreground'
                                    }`}>
                                      {isFree ? (lang === 'ar' ? 'مجاناً' : 'Free') : `+${prep.price.toFixed(3)}`}
                                    </span>
                                    {isSelected && <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })()}
          </div>
        </div>




        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-cairo text-foreground">{t('products.relatedProducts')}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollRelated(lang === 'ar' ? 'right' : 'left')}
                  className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollRelated(lang === 'ar' ? 'left' : 'right')}
                  className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {related.map(p => {
                const rName = lang === 'ar' ? p.name_ar : p.name_en;
                const rHasDiscount = true;
                return (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="group flex-shrink-0 w-[200px] sm:w-[220px] bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-all hover:shadow-lg"
                  >
                    <div className="relative overflow-hidden">
                      <BrandedImage src={p.image_url || '/placeholder.svg'} alt={rName} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                      {rHasDiscount && (
                        <Badge className="absolute top-2 start-2 bg-primary text-primary-foreground text-xs">
                          -{PRODUCT_DISCOUNT_PERCENT}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-cairo font-semibold text-foreground text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">{rName}</h3>
                      <SalePrice price={p.price} className="text-sm mt-2" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Frequently bought together */}
        <RelatedProducts seedIds={[product.id]} variant="detail" limit={4} />

        <RecentlyViewedStrip excludeId={product.id} />
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Quantity stepper */}
          <div className="flex items-center bg-muted/60 rounded-xl border border-border/50 shrink-0">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-9 h-11 flex items-center justify-center text-muted-foreground active:text-foreground"
              aria-label="decrease"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 font-black font-cairo text-foreground text-sm min-w-[1.5rem] text-center">{qty}</span>
            <button
              type="button"
              onClick={() => setQty(qty + 1)}
              className="w-9 h-11 flex items-center justify-center text-primary active:text-primary/80"
              aria-label="increase"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Total + Add button */}
          <button
            type="button"
            disabled={!product.in_stock}
            onClick={() => addItem(product, qty, selectedPreps.length > 0 ? selectedPreps : undefined)}
            className="flex-1 flex items-center justify-between gap-2 bg-primary text-primary-foreground font-cairo font-black rounded-xl h-11 px-3.5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5 text-sm">
              <ShoppingCart className="w-4 h-4" />
              {product.in_stock ? t('products.addToCart') : t('products.outOfStock')}
            </span>
            <span className="text-sm font-black">
              {getProductPricing(product.price, qty).total.toFixed(3)} <span className="text-[10px] opacity-80">{t('products.kwd')}</span>
            </span>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
