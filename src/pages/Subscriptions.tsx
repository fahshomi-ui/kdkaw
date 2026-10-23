import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Calendar, Check, Sparkles, Pause, Play, X, SkipForward,
  Loader2, Repeat, Crown, ChefHat, Phone, MapPin,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useSubscriptionPlans, useMySubscriptions, useCreateSubscription,
  useSubscriptionAction, type SubscriptionPlan,
} from '@/hooks/useSubscriptions';
import { setLastPhone } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { normalizePhone, syncVisitorIdentity } from '@/lib/visitorIdentity';

const PHONE_KEY = 'mk_last_phone';

const FREQ_LABEL: Record<string, { ar: string; en: string }> = {
  weekly: { ar: 'كل أسبوع', en: 'Every week' },
  biweekly: { ar: 'كل أسبوعين', en: 'Every 2 weeks' },
  monthly: { ar: 'شهرياً', en: 'Monthly' },
};

const STATUS_BADGE: Record<string, { ar: string; en: string; cls: string }> = {
  active: { ar: 'نشط', en: 'Active', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  paused: { ar: 'موقوف مؤقتاً', en: 'Paused', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', cls: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

const PlanCard = ({
  plan, onSubscribe, lang,
}: { plan: SubscriptionPlan; onSubscribe: (p: SubscriptionPlan) => void; lang: 'ar' | 'en' }) => {
  const finalPrice = plan.base_price * (1 - plan.discount_percent / 100);
  const isPremium = plan.slug === 'monthly-premium';

  return (
    <div className={`relative rounded-3xl border-2 p-6 transition-all hover:shadow-2xl hover:-translate-y-1 ${
      isPremium
        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-400'
        : 'bg-card border-border hover:border-primary/50'
    }`}>
      {isPremium && (
        <div className="absolute -top-3 start-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Crown className="w-3 h-3" /> {lang === 'ar' ? 'الأكثر قيمة' : 'Best Value'}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          isPremium ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/10 text-primary'
        }`}>
          {plan.frequency === 'weekly' ? <Repeat className="w-6 h-6" /> :
           plan.frequency === 'monthly' ? <Crown className="w-6 h-6" /> :
           <ChefHat className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h3 className="font-extrabold font-cairo text-lg leading-tight">
            {lang === 'ar' ? plan.name_ar : plan.name_en}
          </h3>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {lang === 'ar' ? FREQ_LABEL[plan.frequency].ar : FREQ_LABEL[plan.frequency].en}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 font-cairo line-clamp-2 min-h-[2.5rem]">
        {lang === 'ar' ? plan.description_ar : plan.description_en}
      </p>

      <div className="bg-muted/40 rounded-2xl p-3 mb-4">
        <div className="text-[11px] font-bold text-muted-foreground mb-2 uppercase">
          {lang === 'ar' ? 'المحتويات' : 'What\'s included'}
        </div>
        <ul className="space-y-1.5">
          {plan.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-cairo">{lang === 'ar' ? it.name_ar : it.name_en}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground line-through">
            {plan.base_price.toFixed(3)} {lang === 'ar' ? 'د.ك' : 'KWD'}
          </div>
          <div className="font-extrabold text-2xl text-primary font-cairo">
            {finalPrice.toFixed(3)} <span className="text-sm">{lang === 'ar' ? 'د.ك' : 'KWD'}</span>
          </div>
        </div>
        <div className="bg-emerald-500/15 text-emerald-600 text-xs font-extrabold px-2.5 py-1 rounded-full">
          {lang === 'ar' ? `وفّر ${plan.discount_percent}%` : `Save ${plan.discount_percent}%`}
        </div>
      </div>

      <Button onClick={() => onSubscribe(plan)} className="w-full gap-2" size="lg">
        <Sparkles className="w-4 h-4" />
        {lang === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
      </Button>
    </div>
  );
};

const Subscriptions = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = useSubscriptionPlans();

  const [phone, setPhone] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(PHONE_KEY) || '' : '');
  const { data: mySubs = [], refetch } = useMySubscriptions(phone);
  const createMut = useCreateSubscription();
  const actionMut = useSubscriptionAction();

  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', area: '', block: '', street: '', building: '', notes: '',
  });

  const openSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setForm((f) => ({ ...f, phone: phone || f.phone }));
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!form.name.trim() || !form.phone.trim() || !form.area.trim()) {
      toast.error(lang === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    const normalizedPhone = normalizePhone(form.phone);
    await createMut.mutateAsync({
      plan: selectedPlan,
      customer_name: form.name.trim(),
      customer_phone: normalizedPhone,
      area: form.area.trim(),
      block: form.block.trim() || undefined,
      street: form.street.trim() || undefined,
      building: form.building.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    await syncVisitorIdentity({ name: form.name.trim(), phone: normalizedPhone });
    setLastPhone(normalizedPhone);
    setPhone(normalizedPhone);
    setOpen(false);
    refetch();
  };

  const activeCount = useMemo(() => mySubs.filter((s) => s.status === 'active').length, [mySubs]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Repeat className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'باقات اشتراك' : 'Subscription Boxes'}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-cairo mb-3">
              {lang === 'ar' ? 'وفّر وقتك ومالك مع باقاتنا الدورية' : 'Save Time & Money with Recurring Boxes'}
            </h1>
            <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto font-cairo">
              {lang === 'ar'
                ? 'اختر باقتك المفضّلة وستصلك تلقائياً بسعر مخفّض — ألغِ أو علّق متى شئت.'
                : 'Pick your favorite box, get it delivered automatically at a discount — pause or cancel anytime.'}
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="container mx-auto px-4 py-10">
          {isLoading ? (
            <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSubscribe={openSubscribe} lang={lang} />
              ))}
            </div>
          )}
        </section>

        {/* My Subscriptions */}
        <section className="container mx-auto px-4 pb-12">
          <div className="bg-card border border-border rounded-3xl p-5 md:p-7">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-5">
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-extrabold font-cairo flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {lang === 'ar' ? 'اشتراكاتي' : 'My Subscriptions'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'ar'
                    ? 'أدخل رقم هاتفك لعرض اشتراكاتك وإدارتها'
                    : 'Enter your phone number to view and manage subscriptions'}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+965 9XXX XXXX"
                  className="md:w-56 h-11"
                  dir="ltr"
                />
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => { setLastPhone(phone); refetch(); }}
                >
                  {lang === 'ar' ? 'عرض' : 'View'}
                </Button>
              </div>
            </div>

            {!phone ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {lang === 'ar' ? 'أدخل رقم هاتفك للبحث' : 'Enter your phone to search'}
              </div>
            ) : mySubs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {lang === 'ar' ? 'لا توجد اشتراكات مسجّلة بهذا الرقم' : 'No subscriptions found for this number'}
              </div>
            ) : (
              <>
                {activeCount > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 mb-4 text-sm font-cairo flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {lang === 'ar'
                      ? `لديك ${activeCount} اشتراك نشط`
                      : `You have ${activeCount} active subscription${activeCount > 1 ? 's' : ''}`}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {mySubs.map((sub) => {
                    const badge = STATUS_BADGE[sub.status];
                    return (
                      <div key={sub.id} className="border border-border rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-extrabold font-cairo">
                              {sub.plan ? (lang === 'ar' ? sub.plan.name_ar : sub.plan.name_en) : '—'}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {sub.plan && (lang === 'ar' ? FREQ_LABEL[sub.plan.frequency].ar : FREQ_LABEL[sub.plan.frequency].en)}
                            </div>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                            {lang === 'ar' ? badge.ar : badge.en}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'ar' ? 'التوصيلة القادمة:' : 'Next delivery:'}{' '}
                              <strong className="text-foreground">
                                {new Date(sub.next_delivery_date).toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-US')}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{sub.area}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'ar' ? `${sub.deliveries_count} توصيلة منجزة` : `${sub.deliveries_count} deliveries done`}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {sub.status === 'active' && (
                            <>
                              <Button
                                size="sm" variant="outline" className="gap-1.5"
                                disabled={actionMut.isPending}
                                onClick={() => actionMut.mutate({ subscription_id: sub.id, customer_phone: sub.customer_phone, action: 'skip' })}
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                                {lang === 'ar' ? 'تأجيل التوصيلة' : 'Skip next'}
                              </Button>
                              <Button
                                size="sm" variant="outline" className="gap-1.5"
                                disabled={actionMut.isPending}
                                onClick={() => actionMut.mutate({ subscription_id: sub.id, customer_phone: sub.customer_phone, action: 'pause' })}
                              >
                                <Pause className="w-3.5 h-3.5" />
                                {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
                              </Button>
                            </>
                          )}
                          {sub.status === 'paused' && (
                            <Button
                              size="sm" className="gap-1.5"
                              disabled={actionMut.isPending}
                              onClick={() => actionMut.mutate({ subscription_id: sub.id, customer_phone: sub.customer_phone, action: 'resume' })}
                            >
                              <Play className="w-3.5 h-3.5" />
                              {lang === 'ar' ? 'استئناف' : 'Resume'}
                            </Button>
                          )}
                          {sub.status !== 'cancelled' && (
                            <Button
                              size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive"
                              disabled={actionMut.isPending}
                              onClick={() => {
                                if (confirm(lang === 'ar' ? 'هل أنت متأكد من إلغاء الاشتراك؟' : 'Cancel this subscription?')) {
                                  actionMut.mutate({ subscription_id: sub.id, customer_phone: sub.customer_phone, action: 'cancel' });
                                }
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Subscribe dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cairo">
              {lang === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-2 text-sm">
              <div className="font-extrabold font-cairo">
                {lang === 'ar' ? selectedPlan.name_ar : selectedPlan.name_en}
              </div>
              <div className="text-xs text-muted-foreground">
                {(selectedPlan.base_price * (1 - selectedPlan.discount_percent / 100)).toFixed(3)} {lang === 'ar' ? 'د.ك' : 'KWD'}
                {' • '}
                {lang === 'ar' ? FREQ_LABEL[selectedPlan.frequency].ar : FREQ_LABEL[selectedPlan.frequency].en}
              </div>
            </div>
          )}
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label className="text-xs font-bold">{lang === 'ar' ? 'الاسم *' : 'Name *'}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10" required />
            </div>
            <div>
              <Label className="text-xs font-bold">{lang === 'ar' ? 'رقم الهاتف *' : 'Phone *'}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10" placeholder="+965 9XXX XXXX" dir="ltr" required />
            </div>
            <div>
              <Label className="text-xs font-bold">{lang === 'ar' ? 'المنطقة *' : 'Area *'}</Label>
              <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="h-10" required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-bold">{lang === 'ar' ? 'القطعة' : 'Block'}</Label>
                <Input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs font-bold">{lang === 'ar' ? 'الشارع' : 'Street'}</Label>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label className="text-xs font-bold">{lang === 'ar' ? 'المنزل' : 'Bldg'}</Label>
                <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="h-10" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <Button type="submit" className="w-full gap-2" size="lg" disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {lang === 'ar' ? 'تأكيد الاشتراك' : 'Confirm Subscription'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Subscriptions;