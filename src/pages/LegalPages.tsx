import { useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';
import { FileText, Shield, RefreshCw, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

type PageKey = 'terms' | 'privacy' | 'refund' | 'faq';

const PAGES: Record<PageKey, { icon: any; titleAr: string; titleEn: string }> = {
  terms: { icon: FileText, titleAr: 'الشروط والأحكام', titleEn: 'Terms & Conditions' },
  privacy: { icon: Shield, titleAr: 'سياسة الخصوصية', titleEn: 'Privacy Policy' },
  refund: { icon: RefreshCw, titleAr: 'سياسة الإرجاع والاستبدال', titleEn: 'Refund & Return Policy' },
  faq: { icon: HelpCircle, titleAr: 'الأسئلة الشائعة', titleEn: 'FAQ' },
};

const content: Record<PageKey, { ar: { h: string; p: string }[]; en: { h: string; p: string }[] }> = {
  terms: {
    ar: [
      { h: 'مقدمة', p: 'باستخدامك موقع كي دي كاو، فإنك توافق على الالتزام بهذه الشروط والأحكام. يُرجى قراءتها بعناية قبل إجراء أي طلب.' },
      { h: 'الطلبات والدفع', p: 'جميع الأسعار بالدينار الكويتي وتشمل ما يطبق من رسوم. نحتفظ بحق رفض أو إلغاء أي طلب لأسباب تتعلق بالتوافر أو التحقق.' },
      { h: 'التوصيل', p: 'التوصيل مجاني لجميع مناطق الكويت دون حد أدنى للطلب. تختلف أوقات التوصيل حسب المنطقة، ونبذل قصارى جهدنا للالتزام بالأوقات المعلنة.' },
      { h: 'جودة المنتجات', p: 'نضمن جودة جميع منتجاتنا من الألبان والعصائر والآيس كريم والسمنة. في حال وصول منتج بحالة غير مرضية، يُرجى التواصل معنا خلال ساعتين من الاستلام.' },
      { h: 'المسؤولية', p: 'لا يتحمل كي دي كاو مسؤولية أي ضرر غير مباشر ناتج عن تخزين المنتجات أو استخدامها بعد الاستلام بشكل غير صحيح أو خارج التعليمات.' },
      { h: 'تعديل الشروط', p: 'نحتفظ بحق تعديل هذه الشروط في أي وقت. التعديلات تسري فور نشرها على الموقع.' },
    ],
    en: [
      { h: 'Introduction', p: 'By using KDCow, you agree to comply with these Terms & Conditions. Please read them carefully before placing any order.' },
      { h: 'Orders & Payment', p: 'All prices are in Kuwaiti Dinar (KWD) and include applicable fees. We reserve the right to reject or cancel any order due to availability or verification issues.' },
      { h: 'Delivery', p: 'Delivery is free across all areas of Kuwait with no minimum order. Delivery times vary by area, and we do our best to meet the announced schedules.' },
      { h: 'Product Quality', p: 'We guarantee the quality of all our dairy, juice, ice cream and ghee. If you receive any unsatisfactory product, please contact us within 2 hours of delivery.' },
      { h: 'Liability', p: 'KDCow is not liable for any indirect damages caused by improper storage or handling of products after delivery.' },
      { h: 'Changes to Terms', p: 'We reserve the right to modify these terms at any time. Changes take effect immediately upon posting.' },
    ],
  },
  privacy: {
    ar: [
      { h: 'البيانات التي نجمعها', p: 'نجمع المعلومات التي تقدمها طوعاً عند الطلب: الاسم، رقم الهاتف، عنوان التوصيل. لا نطلب أو نخزن بيانات بطاقة الدفع كاملة.' },
      { h: 'استخدام البيانات', p: 'نستخدم بياناتك فقط لتنفيذ طلبك، التواصل معك بخصوصه، وتحسين خدماتنا. لن نشاركها مع أي طرف ثالث لأغراض تسويقية.' },
      { h: 'حماية البيانات', p: 'نطبق إجراءات تقنية وتنظيمية لحماية بياناتك من الوصول غير المصرح به. اتصالات الدفع مشفّرة وآمنة.' },
      { h: 'ملفات الارتباط (Cookies)', p: 'نستخدم ملفات ارتباط أساسية لتشغيل الموقع وحفظ تفضيلاتك (كاللغة والسلة). يمكنك تعطيلها من إعدادات متصفحك.' },
      { h: 'حقوقك', p: 'يحق لك طلب الاطلاع على بياناتك أو تعديلها أو حذفها بالتواصل معنا عبر معلومات الاتصال أدناه.' },
      { h: 'تواصل معنا', p: 'لأي استفسار حول الخصوصية: info@kdcow.com' },
    ],
    en: [
      { h: 'Data We Collect', p: 'We collect information you voluntarily provide: name, phone number, delivery address. We do not store full card data.' },
      { h: 'Use of Data', p: 'We use your data only to fulfill your order, communicate about it, and improve our services. We do not share it with third parties for marketing.' },
      { h: 'Data Protection', p: 'We apply technical and organizational measures to protect your data. Payment communications are encrypted and secure.' },
      { h: 'Cookies', p: 'We use essential cookies to operate the site and save preferences (language, cart). You can disable them in your browser settings.' },
      { h: 'Your Rights', p: 'You may request access, correction, or deletion of your data by contacting us via the info below.' },
      { h: 'Contact Us', p: 'For privacy inquiries: info@kdcow.com' },
    ],
  },
  refund: {
    ar: [
      { h: 'سياستنا العامة', p: 'نظراً لطبيعة المنتجات الغذائية، فإن سياسة الإرجاع تخضع لشروط محددة لضمان جودة وسلامة الغذاء.' },
      { h: 'حالات الاستبدال أو الاسترداد', p: 'يحق لك طلب الاستبدال أو الاسترداد إذا: وصل المنتج تالفاً، أو غير مطابق للوصف، أو منتهي الصلاحية، أو تم تسليم منتج خاطئ.' },
      { h: 'مدة الإبلاغ', p: 'يجب الإبلاغ خلال ساعتين من استلام الطلب مع إرفاق صور توضح المشكلة، عبر الاتصال المباشر.' },
      { h: 'طريقة الاسترداد', p: 'يتم الاسترداد بنفس وسيلة الدفع الأصلية خلال 5-7 أيام عمل، أو يمكن استبدال المنتج في الطلب التالي.' },
      { h: 'حالات لا تقبل الإرجاع', p: 'لا يقبل الإرجاع في حال: فتح/استخدام المنتج، تخزينه بشكل غير صحيح بعد الاستلام، أو الإبلاغ بعد المدة المحددة.' },
    ],
    en: [
      { h: 'General Policy', p: 'Because these are food products, our return policy follows specific conditions to ensure food safety and quality.' },
      { h: 'Eligibility for Refund/Replacement', p: 'You can request a replacement or refund if: the product arrived damaged, not as described, expired, or wrong item delivered.' },
      { h: 'Reporting Window', p: 'Reports must be made within 2 hours of delivery, with photos showing the issue, via phone call.' },
      { h: 'Refund Method', p: 'Refunds are issued via the original payment method within 5-7 business days, or the product can be replaced in your next order.' },
      { h: 'Non-Returnable Cases', p: 'Returns are not accepted if: product was opened/used, stored improperly after receipt, or reported after the time window.' },
    ],
  },
  faq: {
    ar: [
      { h: 'هل تشمل أسعاركم رسوم التوصيل؟', p: 'التوصيل مجاني لجميع مناطق الكويت، ولا تُضاف أي رسوم توصيل إلى طلبك، دون حد أدنى لقيمة الطلب.' },
      { h: 'ما طرق الدفع المتاحة؟', p: 'نقبل الدفع عبر K-NET، البطاقات الائتمانية (Visa / Mastercard)، والدفع عند الاستلام في بعض المناطق.' },
      { h: 'كم تستغرق مدة التوصيل؟', p: 'عادةً نوصّل خلال 1-3 ساعات داخل مناطق التغطية الرئيسية. الطلبات الكبيرة قد تتطلب وقتاً إضافياً.' },
      { h: 'كيف تحافظون على طزاجة الألبان والآيس كريم أثناء التوصيل؟', p: 'نستخدم سلسلة تبريد محكمة من المستودع وحتى باب منزلك، ونستعمل عبوات معزولة تحافظ على درجة الحرارة طوال مدة التوصيل.' },
      { h: 'هل يمكنني تعديل أو إلغاء طلبي بعد تأكيده؟', p: 'يمكنك تعديل أو إلغاء الطلب عبر التواصل مع خدمة العملاء طالما لم يخرج الطلب من المستودع للتوصيل.' },
      { h: 'كيف أتواصل مع خدمة العملاء؟', p: 'عبر الهاتف الموضّح في صفحة الاتصال، ونرد على جميع الاستفسارات خلال ساعات العمل.' },
    ],
    en: [
      { h: 'Are delivery fees included?', p: 'Delivery is free to all areas of Kuwait. No delivery fees are added to your order, with no minimum order value.' },
      { h: 'What payment methods do you accept?', p: 'We accept K-NET, credit cards (Visa / Mastercard), and cash on delivery in selected areas.' },
      { h: 'How long does delivery take?', p: 'Usually 1-3 hours within main coverage areas. Larger orders may require additional time.' },
      { h: 'How do you keep dairy and ice cream fresh during delivery?', p: 'We use a tight cold chain from our warehouse to your door and insulated packaging that keeps the right temperature throughout delivery.' },
      { h: 'Can I edit or cancel my order after it is confirmed?', p: 'You can edit or cancel your order by contacting customer service as long as it has not yet left the warehouse for delivery.' },
      { h: 'How do I contact customer service?', p: 'Via the phone shown on the contact page. We respond to all inquiries during business hours.' },
    ],
  },
};


const LegalPages = () => {
  const { page } = useParams<{ page: string }>();
  const { lang, dir } = useLanguage();
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement>(null);

  const valid = !!page && page in PAGES;
  const key = (valid ? page : 'terms') as PageKey;
  const meta = PAGES[key];
  const title = lang === 'ar' ? meta.titleAr : meta.titleEn;

  useEffect(() => {
    if (valid) {
      document.title = `${title} - ${lang === 'ar' ? 'كي دي كاو' : 'KDCow'}`;
    }
  }, [title, lang, valid]);

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  const Icon = meta.icon;
  const sections = content[key][lang];
  const tabs: PageKey[] = ['terms', 'privacy', 'refund', 'faq'];
  const isAr = lang === 'ar';
  const currentIdx = tabs.indexOf(key);
  const prevTab = currentIdx > 0 ? tabs[currentIdx - 1] : null;
  const nextTab = currentIdx < tabs.length - 1 ? tabs[currentIdx + 1] : null;

  const scrollRail = (dir: 'prev' | 'next') => {
    const el = railRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.8;
    // In RTL, "prev" visually means scroll to start (positive scrollLeft toward 0)
    const sign = isAr ? -1 : 1;
    el.scrollBy({ left: (dir === 'next' ? 1 : -1) * sign * delta, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="section-x section-y max-w-4xl" dir={dir}>
        {/* Compact geometric header */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-3 sm:p-4 mb-3">
          <div className="absolute -top-10 -end-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-2.5">
            <span className="w-1 h-8 rounded-sm bg-primary shrink-0" />
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-extrabold font-cairo text-foreground truncate leading-tight">
                {title}
              </h1>
              <p className="text-[10px] text-muted-foreground font-cairo">
                {lang === 'ar' ? 'آخر تحديث: 2026' : 'Last updated: 2026'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - horizontal slider with prev/next controls */}
        <div className="relative flex items-center gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => {
              scrollRail('prev');
              if (prevTab) navigate(`/legal/${prevTab}`);
            }}
            disabled={!prevTab}
            aria-label={isAr ? 'السابق' : 'Previous'}
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          <div ref={railRef} className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 snap-x snap-mandatory pb-1">
              {tabs.map(t => {
                const active = t === key;
                const TabIcon = PAGES[t].icon;
                return (
                  <Link
                    key={t}
                    to={`/legal/${t}`}
                    className={`snap-start flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-cairo font-bold border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-foreground/80 border-border hover:border-primary/40'
                    }`}
                  >
                    <TabIcon className="w-3 h-3" />
                    {lang === 'ar' ? PAGES[t].titleAr : PAGES[t].titleEn}
                  </Link>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              scrollRail('next');
              if (nextTab) navigate(`/legal/${nextTab}`);
            }}
            disabled={!nextTab}
            aria-label={isAr ? 'التالي' : 'Next'}
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Content - compact geometric grid of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sections.map((s, i) => (
            <section
              key={i}
              className="relative geo-card p-2.5 hover:border-primary/40 transition-colors"
            >
              <div className="absolute top-0 start-0 w-0.5 h-full bg-primary/70 rounded-s-xl" />
              <div className="ps-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-primary/15 text-primary text-[9px] font-bold font-cairo tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-[12px] font-extrabold font-cairo text-foreground leading-tight truncate">
                    {s.h}
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground font-cairo leading-snug">
                  {s.p}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-3 text-center text-[10px] text-muted-foreground font-cairo">
          {lang === 'ar'
            ? 'لأي استفسار، تواصل معنا عبر info@kdcow.com'
            : 'For any inquiry, contact us at info@kdcow.com'}
        </div>
      </div>
    </Layout>
  );
};

export default LegalPages;
