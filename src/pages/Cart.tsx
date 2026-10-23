import SalePrice from '@/components/SalePrice';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, Scissors, Truck, ArrowLeft, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { PREP_PRICES, PREP_LABELS, getPrepFeesForItem } from '@/lib/preparations';
import Layout from '@/components/Layout';
import cartHero from '@/assets/kdd-hero-dairy.jpg';

const CartHero = () => {
  const { lang } = useLanguage();
  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label={lang === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
    >
      <div className="relative h-[180px] md:h-[280px] w-full">
        <img
          src={cartHero}
          alt={lang === 'ar' ? 'حليب ولبن طازج لسلة مشترياتك' : 'Fresh milk and laban for your shopping basket'}
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 self-start bg-primary/15 backdrop-blur-sm border border-primary/30 rounded-full px-3 py-1 mb-3">
            <ShoppingBag className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] md:text-xs font-cairo font-bold text-primary">
              {lang === 'ar' ? 'سلة التسوق الخاصة بك' : 'Your Shopping Cart'}
            </span>
          </div>
          <h1 className="text-2xl md:text-5xl font-black font-cairo text-foreground leading-tight">
            {lang === 'ar' ? 'تجربة تسوق فاخرة' : 'A Premium Shopping Experience'}
          </h1>
          <p className="mt-2 text-xs md:text-base text-muted-foreground font-cairo max-w-xl">
            {lang === 'ar'
              ? 'راجع منتجاتك الطازجة وأكمل طلبك بكل سهولة وأمان'
              : 'Review your fresh picks and complete your order with ease and confidence'}
          </p>
        </div>
      </div>
    </section>
  );
};

const Cart = () => {
  const { lang, t } = useLanguage();
  const { items, removeItem, updateQuantity, subtotal, discount, deliveryFee, total, preparationFees } = useCart();
  const isRtl = lang === 'ar';
  const navigate = useNavigate();
  const goToCheckout = () => navigate('/checkout');

  const prepLabels: Record<string, { ar: string; en: string }> = {
    clean: { ar: 'تنظيف', en: 'Cleaning' },
    skin: { ar: 'سلخ', en: 'Skinning' },
    fillet: { ar: 'فيليه', en: 'Filleting' },
    slice: { ar: 'شرائح', en: 'Slicing' },
    grill_ready: { ar: 'جاهز للشوي', en: 'Grill Ready' },
    head_remove: { ar: 'إزالة الرأس', en: 'Head Removal' },
    peel: { ar: 'تقشير', en: 'Peeling' },
    devein: { ar: 'إزالة العرق', en: 'Deveining' },
  };

  if (items.length === 0) {
    return (
      <Layout hideFooter>
        <CartHero />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-black font-cairo text-foreground mb-3">{t('cart.empty')}</h2>
          <p className="text-muted-foreground font-cairo mb-8 text-sm">
            {lang === 'ar' ? 'لم تضف أي منتجات بعد، تصفح منتجاتنا الطازجة!' : 'No products added yet, browse our fresh products!'}
          </p>
          <Link to="/products">
            <Button className="font-cairo font-bold rounded-2xl px-8 py-3 text-base shadow-lg shadow-primary/20">
              {t('cart.continueShopping')}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <CartHero />
      <div className="container mx-auto px-4 py-4 md:py-10 pb-32 lg:pb-10">
        <div className="flex justify-end mb-4">
          <Link to="/products" className="text-xs md:text-sm text-primary font-cairo font-bold flex items-center gap-1 hover:underline">
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{lang === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, idx) => (
              <div
                key={`${item.product.id}-${idx}`}
                className="group relative bg-card rounded-2xl border border-border/50 p-4 md:p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={item.product.image_url || '/placeholder.svg'}
                      alt={lang === 'ar' ? item.product.name_ar : item.product.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-cairo font-bold text-foreground text-sm md:text-base truncate">
                          {lang === 'ar' ? item.product.name_ar : item.product.name_en}
                        </h3>
                        {item.product.weight && (
                          <p className="text-xs text-muted-foreground font-cairo mt-0.5">{item.product.weight}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preparations with individual prices */}
                    {item.preparations && item.preparations.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-cairo font-bold">
                          <Scissors className="w-3 h-3 text-primary" />
                          {lang === 'ar' ? 'خيارات التحضير:' : 'Preparation:'}
                        </div>
                        <div className="flex flex-col gap-1 ps-1">
                          {item.preparations.map(p => {
                            const unitPrice = PREP_PRICES[p] ?? 0;
                            const lineTotal = unitPrice * item.quantity;
                            const label = lang === 'ar' ? PREP_LABELS[p]?.ar || p : PREP_LABELS[p]?.en || p;
                            return (
                              <div key={p} className="flex items-center justify-between gap-2 text-[11px] font-cairo bg-primary/5 border border-primary/15 rounded-md px-2 py-1">
                                <span className="text-foreground/80 font-semibold truncate">• {label}</span>
                                <span className={`font-bold whitespace-nowrap ${unitPrice === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                                  {unitPrice === 0
                                    ? (lang === 'ar' ? 'مجاناً' : 'Free')
                                    : `+${lineTotal.toFixed(3)} ${t('products.kwd')}`}
                                </span>
                              </div>
                            );
                          })}
                          {(() => {
                            const itemPrepFees = getPrepFeesForItem(item.preparations, item.quantity);
                            if (itemPrepFees === 0) return null;
                            return (
                              <div className="flex items-center justify-between gap-2 text-[11px] font-cairo px-2 pt-0.5">
                                <span className="text-muted-foreground">
                                  {lang === 'ar' ? 'مجموع التحضير:' : 'Prep total:'}
                                </span>
                                <span className="font-black text-primary">
                                  {itemPrepFees.toFixed(3)} {t('products.kwd')}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-muted/50 rounded-xl border border-border/50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm font-black font-cairo text-foreground min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <SalePrice price={item.product.price} quantity={item.quantity} className="text-base justify-end" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border/50 p-5 md:p-6 space-y-5 sticky top-24">
              <h3 className="font-cairo font-black text-foreground text-lg">
                {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h3>

              <div className="flex items-center gap-2 text-primary bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm font-cairo font-bold">
                <Tag className="w-4 h-4 shrink-0" />
                {lang === 'ar' ? 'خصم 50% على جميع المنتجات' : '50% off all products'}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <div className="flex justify-between text-sm font-cairo">
                  <span className="text-muted-foreground">{lang === 'ar' ? 'المنتجات قبل الخصم' : 'Products before discount'}</span>
                  <span className="text-foreground font-bold">{subtotal.toFixed(3)} {t('products.kwd')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm font-cairo">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'خصم المنتجات 50%' : 'Product discount 50%'}</span>
                    <span className="text-emerald-500 font-bold">-{discount.toFixed(3)} {t('products.kwd')}</span>
                  </div>
                )}
                {preparationFees > 0 && (
                  <div className="flex justify-between text-sm font-cairo">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-primary" />
                      {lang === 'ar' ? 'رسوم تحضير' : 'Preparation Fees'}
                    </span>
                    <span className="text-foreground font-bold">{preparationFees.toFixed(3)} {t('products.kwd')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-cairo">
                  <span className="text-muted-foreground">{t('cart.delivery')}</span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-500 font-bold">{t('cart.free')} ✨</span>
                  ) : (
                    <span className="text-foreground font-bold">{deliveryFee.toFixed(3)} {t('products.kwd')}</span>
                  )}
                </div>
                <div className="flex justify-between font-black text-lg font-cairo border-t border-border/50 pt-4">
                  <span className="text-foreground">{t('cart.total')}</span>
                  <span className="text-primary">{total.toFixed(3)} {t('products.kwd')}</span>
                </div>
              </div>

              {/* Checkout Button - hidden on mobile (sticky bar shown instead) */}
              <Button
                onClick={goToCheckout}
                className="w-full font-cairo font-black text-base rounded-2xl py-6 shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 hidden lg:flex"
                size="lg"
              >
                {t('cart.checkout')}
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] text-muted-foreground font-cairo">
                  {lang === 'ar' ? 'دفع آمن ومضمون 100%' : '100% Secure Payment'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile sticky checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground font-cairo leading-none mb-1">
              {lang === 'ar' ? 'الإجمالي' : 'Total'}
            </p>
            <p className="font-black font-cairo text-primary text-lg leading-none">
              {total.toFixed(3)} <span className="text-xs text-muted-foreground font-bold">{t('products.kwd')}</span>
            </p>
          </div>
          <Button
            onClick={goToCheckout}
            className="flex-[1.4] font-cairo font-black text-sm rounded-xl py-5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            size="lg"
          >
            {t('cart.checkout')}
            {isRtl ? <ArrowLeft className="w-4 h-4 ms-1" /> : <ArrowRight className="w-4 h-4 ms-1" />}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
