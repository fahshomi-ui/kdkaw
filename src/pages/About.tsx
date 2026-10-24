import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Snowflake, Award, Truck, Heart, Leaf, Users, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import logoImg from '@/assets/makani-foods-logo.png';

const About = () => {
  const { lang } = useLanguage();
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    document.title = lang === 'ar' ? 'من نحن - كي دي كاو' : 'About Us - KDCow';
  }, [lang]);

  const values = [
    {
      icon: Snowflake,
      titleAr: 'الجودة أولاً',
      titleEn: 'Quality First',
      descAr: 'نصنع ألباننا وعصائرنا والآيس كريم بمكونات مختارة ومعايير جودة صارمة.',
      descEn: 'We make our dairy, juices and ice cream with selected ingredients and strict quality standards.',
    },
    {
      icon: Truck,
      titleAr: 'توصيل مجاني',
      titleEn: 'Free Delivery',
      descAr: 'نوصل طلبك إلى باب منزلك في نفس اليوم بسلسلة تبريد محكمة للحفاظ على جودة المنتجات.',
      descEn: 'We deliver to your doorstep the same day with a tight cold chain that preserves product quality.',
    },
    {
      icon: Award,
      titleAr: 'موثوقية عالية',
      titleEn: 'High Trust',
      descAr: 'أجيال من العائلات الكويتية تثق بمنتجات كي دي كاو منذ 1962.',
      descEn: 'Generations of Kuwaiti families have trusted KDCow products since 1962.',
    },
    {
      icon: Leaf,
      titleAr: 'مصادر مسؤولة',
      titleEn: 'Responsible Sourcing',
      descAr: 'نتعامل مع موردين ملتزمين بمعايير السلامة الغذائية وسلاسل الإمداد المستدامة.',
      descEn: 'We partner with suppliers who follow food safety standards and sustainable supply-chain practices.',
    },
    {
      icon: Heart,
      titleAr: 'خدمة عملاء استثنائية',
      titleEn: 'Exceptional Service',
      descAr: 'فريقنا متاح دائماً للإجابة على استفساراتك وتلبية احتياجات مطبخك اليومية.',
      descEn: 'Our team is always available to answer your questions and meet your daily kitchen needs.',
    },
    {
      icon: Users,
      titleAr: 'عائلة كي دي كاو',
      titleEn: 'KDCow Family',
      descAr: 'نحن أكثر من متجر — نحن شريكك الموثوق في تجهيز مطبخك بكل ما تحتاجه.',
      descEn: "We're more than a store — we're your trusted partner in stocking everything your kitchen needs.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <img src={logoImg} alt="kdkaw" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 object-contain" />
            <h1 className="text-3xl sm:text-4xl font-cairo font-bold text-foreground mb-3">
              {lang === 'ar' ? 'من نحن' : 'About Us'}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground font-cairo max-w-2xl mx-auto">
              {lang === 'ar'
                ? 'كي دي كاو — ألبان وعصائر وآيس كريم وسمنة منذ 1962.'
                : 'KDCow — dairy, juices, ice cream and ghee since 1962.'}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-cairo font-bold text-foreground mb-4 text-center">
              {lang === 'ar' ? 'قصتنا' : 'Our Story'}
            </h2>
            <div className="space-y-4 text-muted-foreground font-cairo leading-relaxed text-sm sm:text-base">
              {lang === 'ar' ? (
                <>
                  <p>
                    بدأت رحلة <strong className="text-foreground">كي دي كاو</strong> في الكويت عام 1962، بهدف أن تصل
                    إلى كل بيت ألبان وعصائر طازجة بجودة عالية وأسعار منصفة.
                  </p>
                  <p>
                    نحرص على حفظ منتجاتنا ونقلها ضمن سلسلة تبريد محكمة تصل حتى باب منزلك. من الحليب واللبن
                    والزبادي إلى العصائر والآيس كريم والقشطة والسمنة — كل ما تحبه عائلتك تجده عندنا.
                  </p>
                  <p>
                    نؤمن بأن الطعام الجيد يبدأ من المكونات الجيدة، ونحن هنا لنكون شريكك اليومي في تجهيز بيتك بأفضل
                    ما في السوق.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    The journey of <strong className="text-foreground">KDCow</strong> started from a simple
                    goal back in 1962: bringing fresh dairy and juices to every home in Kuwait — with high quality
                    and fair prices.
                  </p>
                  <p>
                    We keep our products in a tight cold chain all the way to your door. From milk, laban and
                    yoghurt to juices, ice cream, cream and ghee — everything your family loves is right here.
                  </p>
                  <p>
                    We believe great food starts with great ingredients, and we're here to be your everyday partner
                    in stocking your home with the very best.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-10 sm:py-14 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-cairo font-bold text-foreground mb-8 text-center">
              {lang === 'ar' ? 'قيمنا' : 'Our Values'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-cairo font-bold text-foreground mb-1.5">
                      {lang === 'ar' ? v.titleAr : v.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground font-cairo leading-relaxed">
                      {lang === 'ar' ? v.descAr : v.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quality Guarantee CTA (single source of truth on /quality-guarantee) */}
        <section className="py-10 sm:py-14 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 sm:p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl sm:text-2xl font-cairo font-extrabold text-foreground mb-2">
                {lang === 'ar' ? 'ضمان الجودة والاستبدال' : 'Quality Guarantee & Returns'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-cairo leading-relaxed max-w-2xl mx-auto mb-5">
                {lang === 'ar'
                  ? 'إن لم يصل المنتج مطابقاً لما تراه على موقعنا بالجودة والوزن — نستبدله مجاناً أو نعيد لك مبلغك بالكامل خلال 24 ساعة.'
                  : "If the product doesn't arrive matching what you see on our site in quality and weight — we replace it free or refund you in full within 24 hours."}
              </p>
              <Link
                to="/quality-guarantee"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-cairo font-bold rounded-2xl hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95"
              >
                {lang === 'ar' ? 'اقرأ تفاصيل الضمان' : 'Read the full guarantee'}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
              {[
                { value: '10K+', labelAr: 'عميل سعيد', labelEn: 'Happy Customers' },
                { value: '600+', labelAr: 'منتج متنوع', labelEn: 'Products' },
                { value: '24/7', labelAr: 'خدمة عملاء', labelEn: 'Support' },
                { value: '5★', labelAr: 'تقييم العملاء', labelEn: 'Customer Rating' },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4">
                  <div className="text-2xl sm:text-3xl font-cairo font-bold text-primary mb-1">{s.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-cairo">
                    {lang === 'ar' ? s.labelAr : s.labelEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
