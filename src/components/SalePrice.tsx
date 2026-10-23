import { useLanguage } from '@/contexts/LanguageContext';
import { getProductPricing, PRODUCT_DISCOUNT_PERCENT } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const SalePrice = ({ price, quantity = 1, className }: { price: number; quantity?: number; className?: string }) => {
  const { lang, t } = useLanguage();
  const pricing = getProductPricing(price, quantity);
  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    return <span className={cn('font-cairo text-xs font-semibold text-muted-foreground', className)}>{lang === 'ar' ? 'السعر غير متوفر' : 'Price unavailable'}</span>;
  }
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-cairo tabular-nums', className)}>
      <span className="font-extrabold text-primary whitespace-nowrap">{pricing.total.toFixed(3)} <span className="text-[10px] font-normal">{t('products.kwd')}</span></span>
      <del className="text-muted-foreground text-[10px] whitespace-nowrap" aria-label={lang === 'ar' ? 'السعر قبل الخصم' : 'Original price'}>{pricing.originalTotal.toFixed(3)}</del>
      <span className="text-[10px] font-bold text-primary whitespace-nowrap">{lang === 'ar' ? 'خصم' : 'OFF'} {PRODUCT_DISCOUNT_PERCENT}%</span>
    </span>
  );
};

export default SalePrice;
