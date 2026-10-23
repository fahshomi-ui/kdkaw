import SalePrice from '@/components/SalePrice';
import { getProductPricing } from '@/lib/pricing';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Package, Truck, MapPin, CreditCard, Landmark, Phone, Copy, ChevronLeft, ChevronRight, PartyPopper, Gift } from 'lucide-react';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getPaymentFlowState, savePaymentFlowState } from '@/lib/paymentFlowState';
import OrderReviewForm from '@/components/OrderReviewForm';

const ConfettiPiece = ({ delay, left, color }: { delay: number; left: number; color: string }) => (
  <div
    className="absolute top-0 w-2 h-2 rounded-sm opacity-0"
    style={{
      left: `${left}%`,
      backgroundColor: color,
      animation: `confettiFall 2.5s ease-out ${delay}s forwards`,
    }}
  />
);

const OrderConfirmation = () => {
  const { lang, t } = useLanguage();
  const location = useLocation();
  const { toast } = useToast();
  const isRtl = lang === 'ar';
  const [showContent, setShowContent] = useState(false);

  const state = (location.state as any) || getPaymentFlowState() || {};
  const orderNumber = state?.orderNumber || 'MF-XXXXXX';
  const items = state?.items || [];
  const form = state?.form || {};
  const paymentMethod = state?.paymentMethod || 'knet';
  const isPendingPayment = state?.paymentStatus === 'pending' || state?.paymentCollected === false || state?.orderStatus === 'pending';
  const subtotal = state?.subtotal || 0;
  const discount = state?.discount || 0;
  const total = state?.total || 0;
  const deliveryFee = state?.deliveryFee || 0;
  const earnedPoints = Math.floor(Number(total) * 10); // 10 pts per KWD

  useEffect(() => {
    if (state && Object.keys(state).length > 0) {
      savePaymentFlowState(state);
    }

    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, [state]);

  const steps = [
    { icon: CheckCircle2, label: { ar: 'تم التأكيد', en: 'Confirmed' }, active: true, done: true },
    { icon: Package, label: { ar: 'قيد التجهيز', en: 'Processing' }, active: true, done: false },
    { icon: Truck, label: { ar: 'قيد التوصيل', en: 'Delivering' }, active: false, done: false },
    { icon: MapPin, label: { ar: 'تم التوصيل', en: 'Delivered' }, active: false, done: false },
  ];

  const prepLabels: Record<string, { ar: string; en: string }> = {
    clean: { ar: 'تنظيف', en: 'Cleaning' }, skin: { ar: 'سلخ', en: 'Skinning' },
    fillet: { ar: 'فيليه', en: 'Filleting' }, slice: { ar: 'شرائح', en: 'Slicing' },
    grill_ready: { ar: 'جاهز للشوي', en: 'Grill Ready' }, head_remove: { ar: 'إزالة الرأس', en: 'Head Removal' },
    peel: { ar: 'تقشير', en: 'Peeling' }, devein: { ar: 'إزالة العرق', en: 'Deveining' },
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    toast({ title: isRtl ? 'تم النسخ!' : 'Copied!', duration: 1500 });
  };

  const confettiColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    delay: Math.random() * 1.5,
    left: Math.random() * 100,
    color: confettiColors[i % confettiColors.length],
  }));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl relative overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map((p, i) => (
            <ConfettiPiece key={i} {...p} />
          ))}
        </div>

        {/* Success Header */}
        <div className={`text-center mb-8 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full bg-emerald-500/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12 text-white drop-shadow-md" />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl md:text-3xl font-black font-cairo text-foreground">
              {isPendingPayment ? (isRtl ? 'تم استلام طلبك!' : 'Order Received!') : (isRtl ? 'تم الطلب بنجاح!' : 'Order Confirmed!')}
            </h1>
            <PartyPopper className="w-5 h-5 text-amber-500 scale-x-[-1]" />
          </div>
          <p className="text-muted-foreground font-cairo text-sm">
            {isPendingPayment
              ? (isRtl ? 'شكراً لك! طلبك محفوظ وقيد الانتظار. لم يتم تحصيل الدفع.' : 'Thank you! Your order is saved and pending. No payment was collected.')
              : (isRtl ? 'شكراً لك! طلبك قيد التجهيز الآن 🎉' : 'Thank you! Your order is being prepared 🎉')}
          </p>
        </div>

        {/* Order Number */}
        <div className={`transition-all duration-700 delay-150 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="mb-4 border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-emerald-600/10 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
            <CardContent className="py-5 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-cairo mb-1">{isRtl ? 'رقم الطلب' : 'Order Number'}</p>
                  <p className="text-2xl font-black text-emerald-600 tracking-wider" dir="ltr">{orderNumber}</p>
                </div>
                <button onClick={copyOrderNumber} className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center hover:bg-emerald-500/25 active:scale-95 transition-all">
                  <Copy className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty points earned (display only — no dedicated page yet) */}
        {earnedPoints > 0 && form.phone && (
          <div className={`transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white p-4 shadow-lg mb-4">
              <Gift className="absolute -bottom-2 -end-2 w-20 h-20 opacity-15" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] opacity-90 font-cairo">
                    {isRtl ? 'كسبت من هذا الطلب' : 'You earned from this order'}
                  </div>
                  <div className="font-extrabold text-lg font-cairo">
                    +{earnedPoints} {isRtl ? 'نقطة 🎉' : 'points 🎉'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Tracking Steps */}
        <div id="order-tracking" className={`scroll-mt-20 transition-all duration-700 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="mb-4">
            <CardContent className="py-5 px-5">
              <h2 className="text-sm font-bold font-cairo text-foreground mb-4">
                {isRtl ? 'تتبع الطلب' : 'Order Tracking'}
              </h2>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-muted-foreground/15 z-0" />
                <div className="absolute top-5 left-[10%] h-0.5 bg-emerald-500 z-0 transition-all duration-1000" style={{ width: showContent ? '22%' : '0%' }} />
                
                {steps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 z-10 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      step.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                      step.active ? 'bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500/30' :
                      'bg-muted text-muted-foreground'
                    }`} style={{ transitionDelay: `${i * 200 + 500}ms` }}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-cairo font-semibold text-center leading-tight ${
                      step.done || step.active ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}>
                      {step.label[lang]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        {items.length > 0 && (
          <div className={`transition-all duration-700 delay-[450ms] ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Card className="mb-4">
              <CardContent className="py-4 px-5">
                <h2 className="text-sm font-bold font-cairo text-foreground mb-3">
                  {isRtl ? 'تفاصيل المنتجات' : 'Order Items'}
                  <span className="text-xs text-muted-foreground font-normal mr-2 ml-2">({items.length})</span>
                </h2>
                <div className="divide-y divide-border">
                  {items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold font-cairo text-foreground truncate">
                          {lang === 'ar' ? item.product?.name_ar : item.product?.name_en}
                        </p>
                        <p className="text-xs text-muted-foreground font-cairo">
                          {isRtl ? 'الكمية' : 'Qty'}: {item.quantity} × {getProductPricing(item.product?.price ?? 0).unitPrice.toFixed(3)} {isRtl ? 'د.ك' : 'KWD'}
                        </p>
                        {item.preparations?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.preparations.map((p: string) => (
                              <span key={p} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-cairo">
                                {prepLabels[p]?.[lang] || p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground shrink-0 font-cairo">
                        <SalePrice price={item.product?.price ?? 0} quantity={item.quantity} className="text-sm justify-end" />
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Price Summary */}
        <div className={`transition-all duration-700 delay-[600ms] ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="mb-4">
            <CardContent className="py-4 px-5">
              <h2 className="text-sm font-bold font-cairo text-foreground mb-3">
                {isRtl ? 'ملخص الدفع' : 'Payment Summary'}
              </h2>
              <div className="space-y-2 text-sm font-cairo">
                <div className="flex justify-between text-muted-foreground">
                  <span>{isRtl ? 'المنتجات قبل الخصم' : 'Products before discount'}</span>
                  <span>{Number(subtotal).toFixed(3)} {isRtl ? 'د.ك' : 'KWD'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{isRtl ? 'خصم المنتجات 50%' : 'Product discount 50%'}</span>
                    <span>-{Number(discount).toFixed(3)} {isRtl ? 'د.ك' : 'KWD'}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{isRtl ? 'التوصيل' : 'Delivery'}</span>
                  <span>{deliveryFee > 0 ? `${Number(deliveryFee).toFixed(3)} ${isRtl ? 'د.ك' : 'KWD'}` : (isRtl ? 'مجاني' : 'Free')}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-black text-foreground text-base">
                  <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-primary">{Number(total).toFixed(3)} {isRtl ? 'د.ك' : 'KWD'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery & Payment Info */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 transition-all duration-700 delay-[750ms] ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card>
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold font-cairo text-foreground">{isRtl ? 'عنوان التوصيل' : 'Delivery Address'}</h3>
              </div>
              <div className="text-xs text-muted-foreground font-cairo space-y-1">
                {form.name && <p className="font-semibold text-foreground">{form.name}</p>}
                {form.area && <p>{isRtl ? 'المنطقة' : 'Area'}: {form.area}</p>}
                {form.block && <p>{isRtl ? 'قطعة' : 'Block'}: {form.block}</p>}
                {form.street && <p>{isRtl ? 'شارع' : 'Street'}: {form.street}</p>}
                {form.building && <p>{isRtl ? 'مبنى' : 'Building'}: {form.building}</p>}
                {(form.floor || form.apartment) && (
                  <p>{form.floor && `${isRtl ? 'طابق' : 'Floor'}: ${form.floor}`} {form.apartment && `- ${isRtl ? 'شقة' : 'Apt'}: ${form.apartment}`}</p>
                )}
                {form.phone && (
                  <div className="flex items-center gap-1 mt-2 text-foreground">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{form.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {paymentMethod === 'card' ? <CreditCard className="w-4 h-4 text-primary" /> : <Landmark className="w-4 h-4 text-primary" />}
                </div>
                <h3 className="text-sm font-bold font-cairo text-foreground">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</h3>
              </div>
              <div className="text-xs text-muted-foreground font-cairo space-y-1">
                <p className="font-semibold text-foreground">
                  {paymentMethod === 'card' ? (isRtl ? 'بطاقة ائتمان' : 'Credit Card') : 'KNET'}
                </p>
                <p className={isPendingPayment ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-emerald-600 font-semibold'}>
                  {isPendingPayment ? (isRtl ? 'لم يتم تحصيل الدفع — الطلب غير مدفوع' : 'Payment not collected — Order unpaid') : (isRtl ? 'تم الدفع بنجاح ✓' : 'Payment Successful ✓')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className={`transition-all duration-700 delay-[900ms] ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Link to="/products" className="block">
              <Button className="w-full font-cairo h-14 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
                <Package className="w-5 h-5" />
                <span>{isRtl ? 'العودة للمتجر' : 'Back to Store'}</span>
              </Button>
            </Link>
            <Link
              to={form.phone ? `/track/${orderNumber}?p=${encodeURIComponent(form.phone)}` : '/track'}
              className="block"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full font-cairo h-14 text-sm font-bold rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
              >
                <Truck className="w-5 h-5" />
                <span>{isRtl ? 'تتبع الطلب مباشر' : 'Track Live'}</span>
              </Button>
            </Link>
          </div>
          <Link to="/" className="block">
            <Button variant="ghost" className="w-full font-cairo h-11 text-sm rounded-xl text-muted-foreground hover:text-foreground">
              {isRtl ? (
                <span className="flex items-center gap-2"><ChevronRight className="w-4 h-4" /> {t('order.backHome')}</span>
              ) : (
                <span className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> {t('order.backHome')}</span>
              )}
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto mt-10">
          <OrderReviewForm
            orderNumber={orderNumber}
            defaultName={form?.name}
            defaultPhone={form?.phone}
          />
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(-20px) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(600px) rotate(720deg) scale(0.3); }
        }
      `}</style>
    </Layout>
  );
};

export default OrderConfirmation;
