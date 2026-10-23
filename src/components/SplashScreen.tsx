import { useState, useEffect } from "react";
import logoImg from "@/assets/makani-foods-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 350);
    const timer2 = setTimeout(() => onFinish(), 700);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-red-600 to-red-700 transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="animate-[bounce-in_0.8s_ease-out] mb-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-4 ring-white/20 p-3">
          <img
            src={logoImg}
            alt={isAr ? "كي دي كاو" : "KDCow"}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Brand Name */}
      <h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 px-4 text-center animate-[fade-up_0.8s_ease-out_0.3s_both]"
        style={{ fontFamily: "Cairo, sans-serif" }}
      >
        {isAr ? "كي دي كاو" : "KDCow"}
      </h1>
      <p className="text-white/80 text-sm sm:text-base md:text-lg px-4 text-center animate-[fade-up_0.8s_ease-out_0.5s_both]">
        {isAr ? "ألبان • عصائر • آيس كريم" : "Dairy • Juices • Ice Creams"}
      </p>

      {/* Loading dots */}
      <div className="mt-10 flex gap-2 animate-[fade-up_0.8s_ease-out_0.7s_both]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-white/60"
            style={{
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
