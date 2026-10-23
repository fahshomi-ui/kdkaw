import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Camera, RefreshCw, Headphones, BadgeCheck, Clock, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Phone } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const QualityGuarantee = () => {
  const { lang } = useLanguage();
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    document.title = lang === 'ar' ? 'ضمان الجودة والاستبدال - كي دي كاو' : 'Quality Guarantee - KDCow';
    const meta = document.querySelector('meta[name="description"]');
    const desc = lang === 'ar'
      ? 'سياسة ضمان الجودة والاستبدال في كي دي كاو — استبدال مجاني أو استرداد كامل خلال 24 ساعة عند اختلاف المنتج عن الصورة.'
      : 'KDCow quality guarantee and return policy — free replacement or full refund within 24 hours if the product differs from the image.';
    if (meta) meta.setAttribute('content', desc);
  }, [lang]);

  const faqs = [
    {
      qAr: 'لماذا تختلف الصور أحياناً عن المنتج الفعلي؟',
      qEn: 'Why do images sometimes differ from the actual product?',
      aAr: 'قد يحدث اختلاف بسيط في التغليف أو اللون أو الحجم بين دفعة وأخرى من نفس المنتج، لكن النوع والوزن والجودة مضمونة 100%.',
      qEn2: '',
      aEn: 'Small variations in packaging, color or size may occur between batches of the same product, but the type, weight and quality are 100% guaranteed.',
    },
    {
      qAr: 'كم لدي من الوقت للإبلاغ عن مشكلة؟',
      qEn: 'How long do I have to report an issue?',
      aAr: 'يجب التواصل معنا خلال ساعتين من استلام الطلب لضمان معالجة طلب الاستبدال أو الاسترداد. هذا الشرط مهم للحفاظ على جودة المنتج وضمان حقوقك.',
      aEn: 'Please contact us within 2 hours of receiving your order to guarantee processing of your replacement or refund request. This timing is important to preserve product quality and your rights.',
    },
    {
      qAr: 'كيف يمكنني الإبلاغ عن مشكلة؟',
      qEn: 'How can I report an issue?',
      aAr: 'يمكنك التواصل معنا عبر الاتصال المباشر، مع إرسال صورة واضحة للمنتج كما استلمته. سيتم الرد عليك خلال 30 دقيقة بحد أقصى.',
      aEn: 'You can contact us by phone, along with a clear photo of the product as received. We will respond within 30 minutes at most.',
    },
    {
      qAr: 'هل يمكنني الاستبدال بعد فتح المنتج أو استخدامه؟',
      qEn: 'Can I return the product after opening or using it?',
      aAr: 'لا، للأسف لا يمكن استبدال المنتج بعد البدء باستخدامه أو فتح تغليفه. يجب أن يكون المنتج في حالته الأصلية مع التغليف.',
      aEn: 'Unfortunately, products that have been opened or used cannot be returned. The product must be in its original state with the original packaging.',
    },
    {
      qAr: 'متى أستلم المبلغ المسترد؟',
      qEn: 'When will I receive my refund?',
      aAr: 'بعد التحقق من الطلب، يتم إرجاع المبلغ كاملاً خلال 24 ساعة بنفس طريقة الدفع التي استخدمتها أو نقداً عند الطلب التالي.',
      aEn: 'After verification, the full amount is refunded within 24 hours using the same payment method, or as cash credit on your next order.',
    },
    {
      qAr: 'هل أتحمل تكلفة شحن الاستبدال؟',
      qEn: 'Do I pay for the replacement shipping?',
      aAr: 'لا، الاستبدال مجاني تماماً ولا تتحمل أي تكلفة إضافية. نحن نوصل المنتج البديل إلى نفس عنوانك بدون رسوم.',
      aEn: 'No, replacement is completely free with no extra cost. We deliver the replacement product to your same address at no charge.',
    },
    {
      qAr: 'ماذا لو وصل الوزن أقل من المعلن؟',
      qEn: 'What if the weight is less than advertised?',
      aAr: 'نعتذر عن أي خطأ. سنعوضك إما بإرسال الفرق فوراً، أو خصم قيمة النقص من طلبك القادم، أو استرداد قيمة النقص — حسب اختيارك.',
      aEn: 'We apologize for any error. We will compensate you either by sending the difference immediately, deducting the shortage from your next order, or refunding the shortage — your choice.',
    },
    {
      qAr: 'هل ضمان الجودة يشمل كل منتجات كي دي كاو؟',
      qEn: 'Does the guarantee cover all KDCow products?',
      aAr: 'نعم، ضمان الجودة يشمل جميع منتجاتنا: الألبان والعصائر والآيس كريم والسمنة. نفس السياسة تنطبق على الجميع.',
      aEn: 'Yes, the quality guarantee covers all our products: dairy, juices, ice cream and ghee. The same policy applies to all.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/15 via-background to-primary/5 py-12 sm:py-16 overflow-hidden">
          <div className="absolute -top-20 -end-20 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -start-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 text-center relative">
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-cairo mb-5">
              <Link to="/" className="hover:text-primary transition-colors">{lang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
              <span>/</span>
              <span className="text-foreground/70">{lang === 'ar' ? 'ضمان الجودة' : 'Quality Guarantee'}</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-cairo font-bold shadow-lg shadow-primary/30 mb-4">
              <ShieldCheck className="w-4 h-4" />
              {lang === 'ar' ? 'وعدنا الكامل لك' : 'Our Full Commitment'}
            </div>
            <h1 className="text-3xl sm:text-5xl font-cairo font-extrabold text-foreground mb-4 leading-tight">
              {lang === 'ar' ? (
                <>ضمان الجودة <span className="text-gradient">والاستبدال</span></>
              ) : (
                <>Quality Guarantee <span className="text-gradient">& Returns</span></>
              )}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground font-cairo max-w-2xl mx-auto leading-relaxed">
              {lang === 'ar'
                ? 'نلتزم بأن يصل إليك المنتج مطابقاً لما تراه على موقعنا — وإن لم يحدث ذلك، فالمسؤولية علينا بالكامل: استبدال مجاني أو استرداد كامل خلال 24 ساعة.'
                : 'We commit to delivering products that match what you see on our site — if not, the responsibility is fully ours: free replacement or full refund within 24 hours.'}
            </p>
          </div>
        </section>

        {/* Image disclosure callout */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-cairo font-extrabold text-foreground text-lg mb-2">
                    {lang === 'ar' ? 'بخصوص صور المنتجات' : 'About Product Images'}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground font-cairo leading-relaxed">
                    {lang === 'ar'
                      ? 'قد يحدث اختلاف بسيط في التغليف أو اللون أو الحجم بين دفعة وأخرى من نفس المنتج، لكن النوع والوزن والجودة مضمونة 100%.'
                      : 'Small variations in packaging, color or size may occur between batches, but type, weight and quality are 100% guaranteed.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="font-cairo font-extrabold text-foreground text-base sm:text-lg">
                    {lang === 'ar' ? 'متى يحق لك الاستبدال؟' : 'When can you return?'}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { ar: 'إذا اختلف المنتج عن الصورة بشكل واضح بالجودة', en: 'Product clearly differs from image in quality' },
                    { ar: 'إذا كان الوزن أقل من المعلن', en: 'Weight is less than advertised' },
                    { ar: 'مشكلة في الطزاجة أو الرائحة', en: 'Issue with freshness or smell' },
                    { ar: 'تغليف تالف عند الاستلام', en: 'Damaged packaging on arrival' },
                    { ar: 'وصول منتج خاطئ غير الذي طلبته', en: 'Wrong product delivered' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 font-cairo">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{lang === 'ar' ? item.ar : item.en}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-cairo font-extrabold text-foreground text-base sm:text-lg">
                    {lang === 'ar' ? 'الشروط الأساسية' : 'Basic conditions'}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { ar: 'التواصل خلال ساعتين من استلام الطلب', en: 'Contact within 2 hours of delivery' },
                    { ar: 'تصوير المنتج في وضعه الأصلي', en: 'Photo of the product in original state' },
                    { ar: 'عدم البدء باستخدامه أو طهيه', en: 'Not used or cooked' },
                    { ar: 'الاحتفاظ بالتغليف والإيصال', en: 'Keep packaging and receipt' },
                    { ar: 'وجود رقم الطلب', en: 'Order number available' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 font-cairo">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>{lang === 'ar' ? item.ar : item.en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <h3 className="font-cairo font-extrabold text-foreground text-lg mb-5 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                {lang === 'ar' ? 'خطوات الاستبدال أو الاسترداد' : 'Return / Refund Process'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { icon: <Headphones className="w-5 h-5" />, ar: 'تواصل معنا', en: 'Contact us', descAr: 'اتصال مباشر', descEn: 'Direct call' },
                  { icon: <Camera className="w-5 h-5" />, ar: 'أرسل صورة', en: 'Send photo', descAr: 'صورة واضحة للمنتج', descEn: 'Clear product photo' },
                  { icon: <Clock className="w-5 h-5" />, ar: 'مراجعة سريعة', en: 'Quick review', descAr: 'خلال 30 دقيقة', descEn: 'Within 30 minutes' },
                  { icon: <BadgeCheck className="w-5 h-5" />, ar: 'استبدال أو استرداد', en: 'Replace or refund', descAr: 'مجاناً وبدون شروط', descEn: 'Free, no questions' },
                ].map((step, i) => (
                  <div key={i} className="relative text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 ring-2 ring-primary/10">
                      {step.icon}
                    </div>
                    <div className="absolute -top-1 start-1/2 translate-x-4 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold font-cairo flex items-center justify-center shadow">
                      {i + 1}
                    </div>
                    <h4 className="font-cairo font-bold text-foreground text-sm mb-0.5">
                      {lang === 'ar' ? step.ar : step.en}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-cairo">
                      {lang === 'ar' ? step.descAr : step.descEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-10 bg-muted/20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-cairo font-extrabold text-foreground mb-2">
                {lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
              </h2>
              <p className="text-sm text-muted-foreground font-cairo">
                {lang === 'ar' ? 'كل ما تحتاج معرفته عن سياسة الاستبدال' : 'Everything you need to know about our return policy'}
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/40 data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="font-cairo font-bold text-start text-foreground hover:no-underline py-4 text-sm sm:text-base">
                    {lang === 'ar' ? faq.qAr : faq.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground font-cairo leading-relaxed pb-4">
                    {lang === 'ar' ? faq.aAr : faq.aEn}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Promise + CTA */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-6 sm:p-8 text-center">
              <BadgeCheck className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-cairo font-extrabold text-foreground text-lg sm:text-xl mb-2">
                {lang === 'ar' ? 'وعد كي دي كاو' : 'The KDCow Promise'}
              </h3>
              <p className="text-sm sm:text-base text-foreground/80 font-cairo leading-relaxed max-w-2xl mx-auto mb-6">
                {lang === 'ar'
                  ? 'رضاك أهم من أي عملية بيع. إذا لم تكن سعيداً بالمنتج لأي سبب، نستبدله مجاناً أو نعيد لك مبلغك بالكامل خلال 24 ساعة.'
                  : 'Your satisfaction matters more than any sale. If you are not happy with the product for any reason, we replace it free or refund you in full within 24 hours.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-cairo font-bold rounded-2xl hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                  <ArrowIcon className="w-4 h-4" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground font-cairo font-bold rounded-2xl hover:border-primary/40 hover:bg-muted/50 transition-all duration-300"
                >
                  {lang === 'ar' ? 'تسوق بثقة الآن' : 'Shop with Confidence'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default QualityGuarantee;
