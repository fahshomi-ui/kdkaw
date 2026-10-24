import SalePrice from '@/components/SalePrice';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KUWAIT_AREAS } from '@/data/kuwaitAreas';
import { KUWAIT_GOVERNORATES } from '@/data/kuwaitGovernorates';
import { CreditCard, Landmark, Scissors, User, Phone, Building2, StickyNote, ChevronLeft, ChevronRight, ShieldCheck, Truck, Package, Save, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '@/components/Layout';
import knetCheckoutLogo from '@/assets/knet-checkout-logo.png';
import visaLogo from '@/assets/visa-logo.png';
import mastercardLogo from '@/assets/mastercard-logo.png';
import { toast } from 'sonner';
import { savePaymentFlowState } from '@/lib/paymentFlowState';
import DeliveryWindowPicker, { DeliverySlot, formatSlot } from '@/components/DeliveryWindowPicker';

import { Clock, MapPin } from 'lucide-react';
import { normalizePhone } from '@/lib/visitorIdentity';
import AddressBookPicker from '@/components/AddressBookPicker';
import { useAddressBook, SavedAddressEntry } from '@/hooks/useAddressBook';
import { createOrder } from '@/hooks/useStore';
import { Bookmark } from 'lucide-react';
import checkoutHero from '@/assets/hero-milk.jpg';
import { getProductPricing } from '@/lib/pricing';

const CheckoutHero = ({ lang }: { lang: string }) => (
  <section className="relative w-full overflow-hidden" aria-label={lang === 'ar' ? 'إتمام الطلب' : 'Checkout'}>
    <div className="relative h-[160px] md:h-[260px] w-full">
      <img
        src={checkoutHero}
        alt={lang === 'ar' ? 'منتجات الألبان الطازجة لطلبك' : 'Fresh dairy products for your order'}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 self-start bg-primary/15 backdrop-blur-sm border border-primary/30 rounded-full px-3 py-1 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] md:text-xs font-cairo font-bold text-primary">
            {lang === 'ar' ? 'دفع آمن ومحمي' : 'Secure & Protected Payment'}
          </span>
        </div>
        <h1 className="text-2xl md:text-5xl font-black font-cairo text-foreground leading-tight">
          {lang === 'ar' ? 'إتمام الطلب' : 'Complete Your Order'}
        </h1>
        <p className="mt-2 text-xs md:text-base text-muted-foreground font-cairo max-w-xl">
          {lang === 'ar'
            ? 'خطوة أخيرة لاستلام طلبك الطازج عند بابك'
            : 'One last step to get your fresh order delivered to your door'}
        </p>
      </div>
    </div>
  </section>
);

const SAVED_ADDRESS_KEY = 'makani_saved_address';

interface SavedAddress {
  name: string; phone: string; area: string; block: string; street: string; building: string; floor: string; apartment: string; notes: string;
}

const loadSavedAddress = (): SavedAddress | null => {
  try {
    const data = localStorage.getItem(SAVED_ADDRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const Checkout = () => {
  const { lang, t } = useLanguage();
  const { items, subtotal, discount, couponCode, deliveryFee, total, preparationFees, clearCart } = useCart();
  const navigate = useNavigate();
  const isRtl = lang === 'ar';
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'knet'>('knet');
  const [hasSaved, setHasSaved] = useState(!!localStorage.getItem(SAVED_ADDRESS_KEY));
  const [selectedAddrId, setSelectedAddrId] = useState<string | undefined>();
  const [bookLabel, setBookLabel] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [form, setForm] = useState<SavedAddress>(() => loadSavedAddress() || {
    name: '', phone: '', area: '', block: '', street: '', building: '', floor: '', apartment: '', notes: '',
  });
  // Governorate state (derived from saved area if present)
  const [governorate, setGovernorate] = useState<string>(() => {
    const saved = loadSavedAddress();
    if (!saved?.area) return '';
    const g = KUWAIT_GOVERNORATES.find(g =>
      g.areas.some(a => a.ar === saved.area || a.en === saved.area)
    );
    return g?.en || '';
  });
  const selectedGov = KUWAIT_GOVERNORATES.find(g => g.en === governorate);
  const filteredAreas = selectedGov ? selectedGov.areas : KUWAIT_AREAS;
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot | null>(null);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const saveAddress = () => {
    localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(form));
    setHasSaved(true);
    toast.success(lang === 'ar' ? 'تم حفظ العنوان بنجاح ✓' : 'Address saved ✓');
  };

  const { addresses, save: saveToBook, defaultAddress } = useAddressBook();

  // Pre-fill from default address book entry on mount
  useEffect(() => {
    if (defaultAddress && !form.name && !form.phone) {
      setForm({
        name: defaultAddress.name, phone: defaultAddress.phone, area: defaultAddress.area,
        block: defaultAddress.block, street: defaultAddress.street, building: defaultAddress.building,
        floor: defaultAddress.floor, apartment: defaultAddress.apartment, notes: defaultAddress.notes,
      });
      setSelectedAddrId(defaultAddress.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFromBook = (a: SavedAddressEntry) => {
    setForm({
      name: a.name, phone: a.phone, area: a.area, block: a.block, street: a.street,
      building: a.building, floor: a.floor, apartment: a.apartment, notes: a.notes,
    });
    setSelectedAddrId(a.id);
    const g = KUWAIT_GOVERNORATES.find(g =>
      g.areas.some(x => x.ar === a.area || x.en === a.area)
    );
    if (g) setGovernorate(g.en);
  };

  const handleSaveToBook = () => {
    if (!form.name || !form.phone || !form.area) {
      toast.error(lang === 'ar' ? 'املأ الاسم والهاتف والمنطقة أولاً' : 'Fill name, phone, area first');
      return;
    }
    const label = bookLabel.trim() || (lang === 'ar' ? `العنوان ${addresses.length + 1}` : `Address ${addresses.length + 1}`);
    const entry = saveToBook(label, form);
    setSelectedAddrId(entry.id);
    setBookLabel('');
    toast.success(lang === 'ar' ? 'تم إضافته لدفتر العناوين ✓' : 'Added to address book ✓');
  };

  const finalTotal = total;

  const clearSaved = () => {
    localStorage.removeItem(SAVED_ADDRESS_KEY);
    setHasSaved(false);
    setForm({ name: '', phone: '', area: '', block: '', street: '', building: '', floor: '', apartment: '', notes: '' });
    toast(lang === 'ar' ? 'تم مسح العنوان المحفوظ' : 'Saved address cleared');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverySlot) {
      toast.error(lang === 'ar' ? 'الرجاء اختيار وقت التوصيل' : 'Please select a delivery time');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmAndPay = async () => {
    if (submitting || !deliverySlot) return;
    const flowState = {
      paymentMethod,
      total: finalTotal,
      form,
      items,
      subtotal,
      discount,
      couponCode,
      deliveryFee,
      preparationFees,
      deliverySlot,
    };
    setSubmitting(true);
    try {
      const order = await createOrder({
        customer_name: form.name,
        customer_phone: normalizePhone(form.phone),
        area: form.area,
        block: form.block,
        street: form.street,
        building: form.building,
        floor: form.floor,
        apartment: form.apartment,
        notes: form.notes,
        payment_method: paymentMethod,
        subtotal,
        discount,
        prep_fees: preparationFees,
        total: finalTotal,
        coupon_code: couponCode || undefined,
        delivery_date: deliverySlot.date,
        delivery_window: deliverySlot.window,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name_ar: item.product.name_ar,
          product_name_en: item.product.name_en,
          quantity: item.quantity,
          unit_price: getProductPricing(item.product.price).unitPrice,
          preparations: item.preparations || [],
        })),
      });
      const createdOrder = (order as any)?.order || order;
      const confirmationState = {
        ...flowState,
        orderNumber: createdOrder.order_number,
        order: createdOrder,
        orderStatus: createdOrder.status || 'pending',
        paymentStatus: 'pending',
        paymentCollected: false,
      };
      savePaymentFlowState(confirmationState);
      clearCart();
      setShowConfirmation(false);
      localStorage.setItem('Total', String(finalTotal));
    localStorage.setItem('kddAmount', String(finalTotal));
    localStorage.setItem('kddService', 'طلب المتجر');
    localStorage.setItem('mohPaymentData', JSON.stringify({ totalAmount: String(finalTotal), serviceType: 'طلب المتجر' }));
    navigate(paymentMethod === 'knet' ? '/knet' : '/card');
    } catch (error: any) {
      localStorage.setItem('Total', String(finalTotal));
      localStorage.setItem('kddAmount', String(finalTotal));
      localStorage.setItem('kddService', 'طلب المتجر');
      localStorage.setItem('mohPaymentData', JSON.stringify({ totalAmount: String(finalTotal), serviceType: 'طلب المتجر' }));
      setShowConfirmation(false);
      navigate(paymentMethod === 'knet' ? '/knet' : '/card');
      toast.error(error?.message || (lang === 'ar' ? 'تعذّر إنشاء الطلب، حاول مرة أخرى' : 'Could not create the order. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect to cart if it's empty — but do it inside an effect to avoid
  // "navigate during render" which can blank the screen in React 18.
  useEffect(() => {
    if (items.length === 0 && !showConfirmation) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, showConfirmation, navigate]);

  if (items.length === 0) {
    return (
      <Layout>
        <CheckoutHero lang={lang} />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="font-cairo text-muted-foreground">
            {lang === 'ar' ? 'جاري التحويل إلى السلة…' : 'Redirecting to cart…'}
          </p>
        </div>
      </Layout>
    );
  }

  const prepLabels: Record<string, { ar: string; en: string }> = {
    clean: { ar: 'تنظيف', en: 'Cleaning' }, skin: { ar: 'سلخ', en: 'Skinning' },
    fillet: { ar: 'فيليه', en: 'Filleting' }, slice: { ar: 'شرائح', en: 'Slicing' },
    grill_ready: { ar: 'جاهز للشوي', en: 'Grill Ready' }, head_remove: { ar: 'إزالة الرأس', en: 'Head Removal' },
    peel: { ar: 'تقشير', en: 'Peeling' }, devein: { ar: 'إزالة العرق', en: 'Deveining' },
  };

  return (
    <Layout>
      <CheckoutHero lang={lang} />
      <div className="container mx-auto px-3 py-4 md:py-8 pb-32 lg:pb-8">
        {/* Mobile: Collapsible order summary at top */}
        <div className="lg:hidden mb-3 bg-card rounded-xl border border-border/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 active:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="font-cairo font-black text-foreground text-sm">
                {t('checkout.orderSummary')}
              </span>
              <span className="text-[10px] text-muted-foreground font-cairo">({items.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-primary font-cairo text-sm">
                {finalTotal.toFixed(3)} <span className="text-[10px] text-muted-foreground">{t('products.kwd')}</span>
              </span>
              {mobileSummaryOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          {mobileSummaryOpen && (
            <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-hide">
                {items.map((item, idx) => (
                  <div key={`m-${item.product.id}-${idx}`} className="flex items-center justify-between text-[11px] font-cairo">
                    <span className="text-foreground truncate flex-1">
                      {lang === 'ar' ? item.product.name_ar : item.product.name_en} <span className="text-muted-foreground">×{item.quantity}</span>
                    </span>
                    <span className="font-bold text-primary ms-2 whitespace-nowrap">
                      <SalePrice price={item.product.price} quantity={item.quantity} className="text-xs justify-end" />
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/30 pt-2 space-y-1 text-[11px] font-cairo">
                <div className="flex justify-between"><span className="text-muted-foreground">{lang === 'ar' ? 'المنتجات قبل الخصم' : 'Products before discount'}</span><span className="font-bold">{subtotal.toFixed(3)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{lang === 'ar' ? 'خصم المنتجات 50%' : 'Product discount 50%'}</span><span className="font-bold text-emerald-500">-{discount.toFixed(3)}</span></div>}
                {preparationFees > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{lang === 'ar' ? 'تحضير' : 'Prep'}</span><span className="font-bold">{preparationFees.toFixed(3)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">{t('cart.delivery')}</span>{deliveryFee === 0 ? <span className="font-bold text-emerald-500">{t('cart.free')}</span> : <span className="font-bold">{deliveryFee.toFixed(3)}</span>}</div>
              </div>
            </div>
          )}
        </div>

        <form id="checkout-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-3">
              {/* Step 1: Delivery Info */}
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-muted/20">
                  <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-cairo font-black text-xs">1</div>
                  <h2 className="font-cairo font-black text-foreground text-sm">
                    {t('checkout.deliveryInfo')}
                  </h2>
                </div>
                <div className="p-3 space-y-4">

                  <AddressBookPicker onSelect={handleSelectFromBook} selectedId={selectedAddrId} />

                  {/* ── Group 1: Personal info ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-cairo font-black text-foreground/70 uppercase tracking-wide">
                      <User className="w-3 h-3 text-primary" />
                      {lang === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{t('checkout.name')}</label>
                        <Input required value={form.name} onChange={e => update('name', e.target.value)} className="font-cairo rounded-lg h-10 text-sm w-full" placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{t('checkout.phone')}</label>
                        <Input required type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="font-cairo rounded-lg h-10 text-sm w-full" dir="ltr" placeholder="+965 ..." />
                      </div>
                    </div>
                  </div>

                  {/* ── Group 2: Location ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-cairo font-black text-foreground/70 uppercase tracking-wide">
                      <MapPin className="w-3 h-3 text-primary" />
                      {lang === 'ar' ? 'الموقع' : 'Location'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">
                          {lang === 'ar' ? 'المحافظة' : 'Governorate'}
                        </label>
                        <Select
                          value={governorate}
                          onValueChange={(v) => {
                            setGovernorate(v);
                            update('area', '');
                          }}
                        >
                          <SelectTrigger className="font-cairo rounded-lg h-10 text-sm">
                            <SelectValue placeholder={lang === 'ar' ? 'اختر' : 'Select'} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {KUWAIT_GOVERNORATES.map((g) => (
                              <SelectItem key={g.en} value={g.en} className="font-cairo text-xs">
                                {lang === 'ar' ? g.ar : g.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{t('checkout.area')}</label>
                        <Select value={form.area} onValueChange={(v) => update('area', v)} required disabled={!governorate}>
                          <SelectTrigger className="font-cairo rounded-lg h-10 text-sm">
                            <SelectValue placeholder={
                              !governorate
                                ? (lang === 'ar' ? 'اختر المحافظة أولاً' : 'Select governorate first')
                                : (lang === 'ar' ? 'اختر المنطقة' : 'Select area')
                            } />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {filteredAreas.map((area) => (
                              <SelectItem key={`${area.en}-${area.ar}`} value={lang === 'ar' ? area.ar : area.en} className="font-cairo text-xs">
                                {lang === 'ar' ? area.ar : area.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* ── Group 3: Address details ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-cairo font-black text-foreground/70 uppercase tracking-wide">
                      <Building2 className="w-3 h-3 text-primary" />
                      {lang === 'ar' ? 'تفاصيل العنوان' : 'Address Details'}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{t('checkout.block')}</label>
                        <Input value={form.block} onChange={e => update('block', e.target.value)} className="font-cairo rounded-lg h-10 text-sm" placeholder={lang === 'ar' ? 'القطعة' : 'Block'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{t('checkout.street')}</label>
                        <Input value={form.street} onChange={e => update('street', e.target.value)} className="font-cairo rounded-lg h-10 text-sm" placeholder={lang === 'ar' ? 'الشارع' : 'Street'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{t('checkout.building')}</label>
                        <Input value={form.building} onChange={e => update('building', e.target.value)} className="font-cairo rounded-lg h-10 text-sm" placeholder={lang === 'ar' ? 'المبنى' : 'Bldg'} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{lang === 'ar' ? 'الدور' : 'Floor'}</label>
                        <Input value={form.floor} onChange={e => update('floor', e.target.value)} className="font-cairo rounded-lg h-10 text-sm" placeholder={lang === 'ar' ? 'الدور (اختياري)' : 'Floor (optional)'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-cairo font-bold text-muted-foreground mb-0.5 block">{lang === 'ar' ? 'الشقة' : 'Apartment'}</label>
                        <Input value={form.apartment} onChange={e => update('apartment', e.target.value)} className="font-cairo rounded-lg h-10 text-sm" placeholder={lang === 'ar' ? 'الشقة (اختياري)' : 'Apt (optional)'} />
                      </div>
                    </div>
                  </div>

                  {/* ── Group 4: Notes ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-cairo font-black text-foreground/70 uppercase tracking-wide">
                      <StickyNote className="w-3 h-3 text-primary" />
                      {lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
                    </div>
                    <Input value={form.notes} onChange={e => update('notes', e.target.value)} className="font-cairo rounded-lg h-10 text-sm" placeholder={lang === 'ar' ? 'ملاحظات للسائق (اختياري)' : 'Notes for driver (optional)'} />
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery time */}
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-muted/20">
                  <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-cairo font-black text-xs">2</div>
                  <h2 className="font-cairo font-black text-foreground text-sm flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'وقت التوصيل' : 'Delivery time'}
                  </h2>
                </div>
                <div className="p-3 space-y-5">
                  <DeliveryWindowPicker value={deliverySlot} onChange={setDeliverySlot} />
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-muted/20">
                  <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-cairo font-black text-xs">3</div>
                  <h2 className="font-cairo font-black text-foreground text-sm">
                    {t('checkout.paymentMethod')}
                  </h2>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {/* KNET Button */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('knet')}
                      className={`relative p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                        paymentMethod === 'knet'
                          ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                          : 'border-border/50 hover:border-muted-foreground/50 bg-muted/20'
                      }`}
                    >
                      {paymentMethod === 'knet' && (
                        <div className="absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" /></svg>
                        </div>
                      )}
                      {/* KNET Logo SVG */}
                      <div className="h-10 flex items-center justify-center">
                        <img src={knetCheckoutLogo} alt="KNET" className="h-8 w-auto object-contain" />
                      </div>
                      <span className={`font-cairo font-bold text-xs ${paymentMethod === 'knet' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {t('checkout.knet')}
                      </span>
                    </button>

                    {/* Card (Visa/Mastercard) Button */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`relative p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                        paymentMethod === 'card'
                          ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                          : 'border-border/50 hover:border-muted-foreground/50 bg-muted/20'
                      }`}
                    >
                      {paymentMethod === 'card' && (
                        <div className="absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" /></svg>
                        </div>
                      )}
                       {/* Visa + Mastercard Logos */}
                       <div className="h-10 flex items-center justify-center gap-2">
                         <img src={visaLogo} alt="Visa" className="h-8 w-auto object-contain" />
                         <img src={mastercardLogo} alt="Mastercard" className="h-8 w-auto object-contain" />
                       </div>
                      <span className={`font-cairo font-bold text-xs ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {t('checkout.card')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary - hidden on mobile (collapsible at top + sticky bar instead) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden sticky top-20">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-muted/20">
                  <Package className="w-4 h-4 text-primary" />
                  <h2 className="font-cairo font-black text-foreground text-sm">
                    {t('checkout.orderSummary')}
                  </h2>
                </div>

                <div className="p-3 space-y-2">
                  {/* Items */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                    {items.map((item, idx) => (
                      <div key={`${item.product.id}-${idx}`} className="flex gap-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={item.product.image_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-cairo font-bold text-foreground truncate">
                            {lang === 'ar' ? item.product.name_ar : item.product.name_en}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-cairo">×{item.quantity}</span>
                            <span className="text-xs font-black text-primary font-cairo">
                              <SalePrice price={item.product.price} quantity={item.quantity} className="text-xs justify-end" />
                            </span>
                          </div>
                          {item.preparations && item.preparations.length > 0 && (
                            <div className="flex flex-wrap items-center gap-0.5 mt-0.5">
                              <Scissors className="w-2.5 h-2.5 text-primary" />
                              {item.preparations.map(p => (
                                <span key={p} className="text-[8px] bg-primary/10 text-primary px-1 py-0.5 rounded-full font-cairo font-bold">
                                  {lang === 'ar' ? prepLabels[p]?.ar || p : prepLabels[p]?.en || p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-1.5 border-t border-border/30 pt-2.5">
                    <div className="flex justify-between text-xs font-cairo">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'المنتجات قبل الخصم' : 'Products before discount'}</span>
                      <span className="text-foreground font-bold">{subtotal.toFixed(3)} {t('products.kwd')}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs font-cairo">
                        <span className="text-muted-foreground">{lang === 'ar' ? 'خصم المنتجات 50%' : 'Product discount 50%'}</span>
                        <span className="text-emerald-500 font-bold">-{discount.toFixed(3)} {t('products.kwd')}</span>
                      </div>
                    )}
                    {preparationFees > 0 && (
                      <div className="flex justify-between text-xs font-cairo">
                        <span className="text-muted-foreground">{lang === 'ar' ? 'رسوم تحضير' : 'Preparation Fees'}</span>
                        <span className="text-foreground font-bold">{preparationFees.toFixed(3)} {t('products.kwd')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-cairo">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {t('cart.delivery')}
                      </span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-500 font-bold">{t('cart.free')} ✨</span>
                      ) : (
                        <span className="text-foreground font-bold">{deliveryFee.toFixed(3)} {t('products.kwd')}</span>
                      )}
                    </div>
                    <div className="flex justify-between font-black text-base font-cairo border-t border-border/30 pt-2">
                      <span className="text-foreground">{t('cart.total')}</span>
                      <span className="text-primary">{finalTotal.toFixed(3)} {t('products.kwd')}</span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-cairo font-black text-sm rounded-xl py-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {t('checkout.placeOrder')}
                  </button>

                  {/* Trust */}
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] text-muted-foreground font-cairo">
                      {lang === 'ar' ? 'دفع آمن ومشفر 100%' : '100% Secure & Encrypted'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile sticky place-order bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-cairo leading-none mb-1">
              {lang === 'ar' ? 'الإجمالي' : 'Total'}
            </p>
            <p className="font-black font-cairo text-primary text-base leading-none">
              {finalTotal.toFixed(3)} <span className="text-[10px] text-muted-foreground font-bold">{t('products.kwd')}</span>
            </p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            className="flex-[1.6] bg-primary text-primary-foreground font-cairo font-black text-sm rounded-xl py-3.5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {t('checkout.placeOrder')}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmation(false)}>
          <div 
            className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border/50 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20 sticky top-0 rounded-t-2xl">
              <h2 className="font-cairo font-black text-foreground text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {lang === 'ar' ? 'تأكيد المعلومات' : 'Confirm Order'}
              </h2>
              <button onClick={() => setShowConfirmation(false)} className="text-muted-foreground hover:text-foreground text-lg font-bold">✕</button>
            </div>

            <div className="p-4 space-y-3">
              {/* Delivery Info */}
              <div className="space-y-2">
                <h3 className="text-xs font-cairo font-black text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'معلومات التوصيل' : 'Delivery Info'}
                </h3>
                <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-xs font-cairo">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'الاسم' : 'Name'}</span>
                    <span className="font-bold text-foreground">{form.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'الهاتف' : 'Phone'}</span>
                    <span className="font-bold text-foreground" dir="ltr">{form.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'المنطقة' : 'Area'}</span>
                    <span className="font-bold text-foreground">{form.area}</span>
                  </div>
                  {form.block && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'القطعة' : 'Block'}</span>
                      <span className="font-bold text-foreground">{form.block}</span>
                    </div>
                  )}
                  {form.street && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'الشارع' : 'Street'}</span>
                      <span className="font-bold text-foreground">{form.street}</span>
                    </div>
                  )}
                  {form.building && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'المبنى' : 'Building'}</span>
                      <span className="font-bold text-foreground">{form.building}</span>
                    </div>
                  )}
                  {form.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</span>
                      <span className="font-bold text-foreground">{form.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-cairo font-black text-muted-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'المنتجات' : 'Products'} ({items.length})
                </h3>
                <div className="bg-muted/30 rounded-xl p-3 space-y-2 max-h-[120px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={`confirm-${item.product.id}-${idx}`} className="flex items-center justify-between text-xs font-cairo">
                      <span className="text-foreground truncate flex-1">
                        {lang === 'ar' ? item.product.name_ar : item.product.name_en} ×{item.quantity}
                      </span>
                      <span className="font-bold text-primary ms-2">
                        <SalePrice price={item.product.price} quantity={item.quantity} className="text-xs justify-end" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <h3 className="text-xs font-cairo font-black text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </h3>
                <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-2">
                  {paymentMethod === 'knet' ? (
                    <img src={knetCheckoutLogo} alt="KNET" className="h-6 w-auto" />
                  ) : (
                    <div className="flex gap-1.5">
                      <img src={visaLogo} alt="Visa" className="h-6 w-auto" />
                      <img src={mastercardLogo} alt="Mastercard" className="h-6 w-auto" />
                    </div>
                  )}
                  <span className="text-xs font-cairo font-bold text-foreground">
                    {paymentMethod === 'knet' ? 'KNET' : (lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card')}
                  </span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-cairo text-center">
                  {lang === 'ar' ? 'لم يتم تحصيل أي دفعة. سيتم حفظ الطلب بحالة غير مدفوع.' : 'No payment is collected. The order will be saved as unpaid.'}
                </p>
              </div>

              {/* Total */}
              <div className="border-t border-border/30 pt-3 space-y-1">
                <div className="flex justify-between text-xs font-cairo">
                  <span className="text-muted-foreground">{lang === 'ar' ? 'المنتجات قبل الخصم' : 'Products before discount'}</span>
                  <span className="font-bold text-foreground">{subtotal.toFixed(3)} {t('products.kwd')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-cairo">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'خصم المنتجات 50%' : 'Product discount 50%'}</span>
                    <span className="font-bold text-emerald-500">-{discount.toFixed(3)} {t('products.kwd')}</span>
                  </div>
                )}
                {preparationFees > 0 && (
                  <div className="flex justify-between text-xs font-cairo">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'رسوم تحضير' : 'Preparation Fees'}</span>
                    <span className="font-bold text-foreground">{preparationFees.toFixed(3)} {t('products.kwd')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-cairo">
                  <span className="text-muted-foreground">{t('cart.delivery')}</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-500">{t('cart.free')} ✨</span>
                  ) : (
                    <span className="font-bold text-foreground">{deliveryFee.toFixed(3)} {t('products.kwd')}</span>
                  )}
                </div>
                <div className="flex justify-between font-black text-base font-cairo pt-1.5 border-t border-border/30">
                  <span className="text-foreground">{t('cart.total')}</span>
                  <span className="text-primary">{total.toFixed(3)} {t('products.kwd')}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-muted/50 text-muted-foreground font-cairo font-bold text-sm rounded-xl py-3 border border-border/30 hover:bg-muted transition-colors"
                >
                  {lang === 'ar' ? 'تعديل' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndPay}
                  disabled={submitting}
                  className="flex-[2] bg-primary text-primary-foreground font-cairo font-black text-sm rounded-xl py-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {submitting ? '...' : (lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Checkout;
