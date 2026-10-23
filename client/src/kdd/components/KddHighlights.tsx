import { Award, Leaf, Truck, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/kdd/contexts/LanguageContext";
import story from "@/kdd/assets/kdd-story.jpg";

const KddHighlights = () => {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const features = [
    {
      icon: Award,
      t: ar ? "خبرة منذ 1962" : "Since 1962",
      d: ar ? "أكثر من 60 عاماً من الثقة" : "60+ years of trust",
    },
    {
      icon: Leaf,
      t: ar ? "مكونات طبيعية" : "Natural Ingredients",
      d: ar ? "طازجة يومياً" : "Fresh every day",
    },
    {
      icon: ShieldCheck,
      t: ar ? "أعلى معايير الجودة" : "Top Quality",
      d: ar ? "رقابة صارمة في كل مرحلة" : "Strict control at every step",
    },
    {
      icon: Truck,
      t: ar ? "توصيل مجاني" : "Free Delivery",
      d: ar ? "لجميع مناطق الكويت" : "Across Kuwait",
    },
  ];
  const stats = [
    { n: "1962", l: ar ? "سنة التأسيس" : "Founded" },
    { n: "+150", l: ar ? "منتج" : "Products" },
    { n: "4", l: ar ? "فئات رئيسية" : "Categories" },
    { n: "100%", l: ar ? "صناعة كويتية" : "Made in Kuwait" },
  ];

  return (
    <div className="font-cairo">
      <section className="container mx-auto px-3 sm:px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {features.map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-2xl border border-gold/30 bg-card p-5 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base">{t}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-wine text-wine-foreground py-14 sm:py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl border border-gold/40" />
            <img
              src={story}
              alt={ar ? "مزارع وألبان كي دي دي" : "KDD farms and dairy"}
              loading="lazy"
              width={1200}
              height={896}
              className="relative rounded-3xl w-full object-cover aspect-[4/3] shadow-2xl"
            />
          </div>
          <div>
            <span className="text-gold text-sm font-bold tracking-widest">
              {ar ? "قصتنا" : "OUR STORY"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 leading-tight">
              {ar ? "جزء من كل بيت كويتي" : "Part of Every Kuwaiti Home"}
            </h2>
            <p className="mt-4 text-wine-foreground/80 leading-relaxed">
              {ar
                ? "منذ عام 1962 وشركة الكويت للألبان (كي دي دي) تقدم لأجيال من العائلات منتجات ألبان وعصائر وآيس كريم بجودة عالية وطعم أصيل، مع التزام دائم بالنضارة والسلامة الغذائية."
                : "Since 1962, Kuwait Danish Dairy (KDD) has served generations of families with dairy, juices and ice cream of exceptional quality and authentic taste."}
            </p>
            <div className="grid grid-cols-4 gap-3 mt-8">
              {stats.map(stat => (
                <div
                  key={stat.l}
                  className="text-center border-s border-gold/30 first:border-s-0"
                >
                  <div className="text-xl sm:text-3xl font-extrabold text-gold">
                    {stat.n}
                  </div>
                  <div className="text-[11px] sm:text-xs text-wine-foreground/70 mt-1">
                    {stat.l}
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://kddproducts.lovable.app/about"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-8 px-7 py-3 rounded-full bg-gold text-gold-foreground font-bold hover:opacity-90 transition"
            >
              {ar ? "اعرف المزيد عنا" : "Learn More"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KddHighlights;
