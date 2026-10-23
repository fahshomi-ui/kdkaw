import { useLanguage } from '@/contexts/LanguageContext';
import { PRODUCT_DISCOUNT_PERCENT } from '@/lib/pricing';

const PaymentPriceSummary = ({ subtotal, discount, deliveryFee = 0, preparationFees = 0 }: { subtotal: number; discount: number; deliveryFee?: number; preparationFees?: number }) => {
  const { lang, t } = useLanguage();
  return (
    <div className="space-y-1 text-xs font-cairo text-foreground border-t border-border py-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between gap-3"><span>{lang === 'ar' ? 'المنتجات قبل الخصم' : 'Products before discount'}</span><span>{subtotal.toFixed(3)} {t('products.kwd')}</span></div>
      <div className="flex justify-between gap-3 text-primary font-bold"><span>{lang === 'ar' ? 'خصم المنتجات' : 'Product discount'} {PRODUCT_DISCOUNT_PERCENT}%</span><span>−{discount.toFixed(3)} {t('products.kwd')}</span></div>
      {preparationFees > 0 && <div className="flex justify-between gap-3"><span>{lang === 'ar' ? 'رسوم التحضير' : 'Preparation fees'}</span><span>{preparationFees.toFixed(3)} {t('products.kwd')}</span></div>}
      <div className="flex justify-between gap-3"><span>{t('cart.delivery')}</span><span className="font-bold text-primary">{deliveryFee === 0 ? t('cart.free') : `${deliveryFee.toFixed(3)} ${t('products.kwd')}`}</span></div>
    </div>
  );
};

export default PaymentPriceSummary;