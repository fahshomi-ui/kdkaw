import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package, CheckCircle2, Clock, ChefHat, Truck, MapPin, Phone, Search,
  PartyPopper, AlertCircle, Loader2,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DriverMap from '@/components/DriverMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { syncVisitorIdentity, normalizePhone } from '@/lib/visitorIdentity';

interface Order {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  area: string;
  delivery_date: string | null;
  delivery_window: string | null;
  created_at: string;
  updated_at: string;
  payment_method: string;
  location_lat?: number | null;
  location_lng?: number | null;
}

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_META: Record<string, { ar: string; en: string; icon: any; color: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', icon: Clock, color: 'amber' },
  confirmed: { ar: 'مؤكّد', en: 'Confirmed', icon: CheckCircle2, color: 'blue' },
  preparing: { ar: 'قيد التحضير', en: 'Preparing', icon: ChefHat, color: 'orange' },
  out_for_delivery: { ar: 'في الطريق إليك', en: 'Out for delivery', icon: Truck, color: 'purple' },
  delivered: { ar: 'تم التوصيل', en: 'Delivered', icon: PartyPopper, color: 'emerald' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', icon: AlertCircle, color: 'red' },
};

const colorClasses: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-500/30', bar: 'bg-amber-500' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500/30', bar: 'bg-blue-500' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-500/30', bar: 'bg-orange-500' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-500/30', bar: 'bg-purple-500' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500/30', bar: 'bg-emerald-500' },
  red: { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-500/30', bar: 'bg-red-500' },
};

const SearchView = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [num, setNum] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNum = num.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedNum || !trimmedPhone) {
      toast.error(lang === 'ar' ? 'يرجى إدخال رقم الطلب والهاتف' : 'Please enter order number and phone');
      return;
    }
    setLoading(true);
    const normalizedPhone = normalizePhone(trimmedPhone);
    const { data, error } = await supabase
      .from('orders')
      .select('order_number, customer_phone')
      .eq('order_number', trimmedNum)
      .eq('customer_phone', normalizedPhone)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast.error(lang === 'ar' ? 'لم نجد طلباً مطابقاً' : 'No matching order found');
      return;
    }
    // اربط هذا الزائر ببطاقته في لوحة التحكم حتى يظهر طلبه فوراً
    await syncVisitorIdentity({ phone: normalizePhone(trimmedPhone) });
    navigate(`/track/${trimmedNum}?p=${encodeURIComponent(normalizedPhone)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-cairo mb-2">
              {lang === 'ar' ? 'تتبّع طلبك' : 'Track Your Order'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'أدخل رقم الطلب ورقم الهاتف لرؤية حالته الحالية'
                : 'Enter your order number and phone to see live status'}
            </p>
          </div>

          <form onSubmit={onSearch} className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block">
                {lang === 'ar' ? 'رقم الطلب' : 'Order number'}
              </label>
              <Input
                value={num}
                onChange={(e) => setNum(e.target.value)}
                placeholder="MK-2026-0001"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block">
                {lang === 'ar' ? 'رقم الهاتف' : 'Phone number'}
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+965 9XXX XXXX"
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {lang === 'ar' ? 'تتبّع الطلب' : 'Track order'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const OrderTracking = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { lang } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Allow phone match via ?p= query for privacy
  const phoneParam = typeof window !== 'undefined'
    ? normalizePhone(new URLSearchParams(window.location.search).get('p') || '')
    : '';

  useEffect(() => {
    if (!orderNumber) return;
    let active = true;

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .eq('customer_phone', phoneParam)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder(data as Order);
      }
      setLoading(false);
    };

    fetchOrder();
    const onReconnect = () => { void fetchOrder(); };
    window.addEventListener('kdcow-socket-reconnect', onReconnect);

    // Realtime subscription
    const channel = supabase
      .channel(`order-${orderNumber}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${orderNumber}` },
        (payload) => {
          const updated = payload.new as Order;
          if (updated.customer_phone === phoneParam) {
            setOrder(updated);
            toast.success(
              lang === 'ar'
                ? `تم تحديث حالة الطلب: ${STATUS_META[updated.status]?.ar || updated.status}`
                : `Order updated: ${STATUS_META[updated.status]?.en || updated.status}`,
            );
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener('kdcow-socket-reconnect', onReconnect);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, phoneParam]);

  if (!orderNumber || !phoneParam) return <SearchView />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">
            {lang === 'ar' ? 'لم نجد الطلب' : 'Order not found'}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === 'ar' ? 'تأكد من رقم الطلب والهاتف' : 'Check the order number and phone'}
          </p>
          <Link to="/track" className="text-primary underline">
            {lang === 'ar' ? 'بحث جديد' : 'New search'}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const c = colorClasses[meta.color];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Status hero */}
        <div className={`relative overflow-hidden rounded-3xl ${c.bg} text-white p-6 md:p-8 mb-6 shadow-xl`}>
          <div className="relative z-10">
            <div className="text-xs opacity-90 mb-1">
              {lang === 'ar' ? 'رقم الطلب' : 'Order'} #{order.order_number}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <meta.icon className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-cairo">
                {lang === 'ar' ? meta.ar : meta.en}
              </h1>
            </div>
            <p className="text-sm opacity-95 font-cairo">
              {lang === 'ar'
                ? `أهلاً ${order.customer_name}، نحن نعتني بطلبك.`
                : `Hi ${order.customer_name}, we're taking care of your order.`}
            </p>
          </div>
          <div className="absolute -bottom-4 -end-4 opacity-15 text-[140px] leading-none select-none">
            <Package className="w-40 h-40" />
          </div>
          <div className="absolute top-3 end-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled ? (
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-6">
            <h2 className="font-bold text-lg mb-5 font-cairo">
              {lang === 'ar' ? 'مراحل الطلب' : 'Order timeline'}
            </h2>
            <div className="relative">
              {STATUS_FLOW.map((s, i) => {
                const m = STATUS_META[s];
                const done = i <= currentIndex;
                const active = i === currentIndex;
                const cc = colorClasses[m.color];
                return (
                  <div key={s} className="flex gap-4 pb-6 last:pb-0 relative">
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className={`absolute top-10 ${lang === 'ar' ? 'right-5' : 'left-5'} w-0.5 h-full -translate-x-1/2 ${
                          i < currentIndex ? cc.bar : 'bg-border'
                        }`}
                        style={{ [lang === 'ar' ? 'right' : 'left']: '20px' }}
                      />
                    )}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        done
                          ? `${cc.bg} text-white shadow-md`
                          : 'bg-muted text-muted-foreground'
                      } ${active ? `ring-4 ${cc.ring} animate-pulse` : ''}`}
                    >
                      <m.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className={`font-bold font-cairo ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {lang === 'ar' ? m.ar : m.en}
                      </div>
                      {active && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {lang === 'ar' ? 'الحالة الحالية' : 'Current step'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl p-5 mb-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">
              {lang === 'ar' ? 'تم إلغاء هذا الطلب' : 'This order was cancelled'}
            </div>
          </div>
        )}

        {/* Live driver map - only when out for delivery (or preparing for preview) */}
        {!isCancelled && (order.status === 'out_for_delivery' || order.status === 'preparing') && (
          <DriverMap
            orderId={order.id}
            customerLat={order.location_lat ? Number(order.location_lat) : null}
            customerLng={order.location_lng ? Number(order.location_lng) : null}
            status={order.status}
          />
        )}

        {/* Details */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="font-bold text-lg font-cairo">
            {lang === 'ar' ? 'تفاصيل الطلب' : 'Order details'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'منطقة التوصيل' : 'Delivery area'}
                </div>
                <div className="font-semibold">{order.area}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
              <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'رقم التواصل' : 'Contact'}
                </div>
                <div className="font-semibold" dir="ltr">{order.customer_phone}</div>
              </div>
            </div>

            {order.delivery_date && (
              <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {lang === 'ar' ? 'موعد التوصيل' : 'Delivery slot'}
                  </div>
                  <div className="font-semibold">
                    {new Date(order.delivery_date).toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-US')}
                    {order.delivery_window && ` • ${order.delivery_window}`}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
              <Package className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'الإجمالي' : 'Total'}
                </div>
                <div className="font-bold text-primary">
                  {Number(order.total).toFixed(3)} {lang === 'ar' ? 'د.ك' : 'KWD'}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground text-center pt-2 border-t border-border">
            {lang === 'ar' ? 'تم الطلب في' : 'Placed on'}{' '}
            {new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-KW' : 'en-US')}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/track" className="text-sm text-primary underline">
            {lang === 'ar' ? 'تتبّع طلب آخر' : 'Track another order'}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderTracking;
