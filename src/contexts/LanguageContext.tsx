import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

// Keep a single context instance across hot reloads so live edits don't blank the page
const g = globalThis as unknown as { __kddLangCtx?: React.Context<LanguageContextType | undefined> };
const LanguageContext = g.__kddLangCtx ?? (g.__kddLangCtx = createContext<LanguageContextType | undefined>(undefined));

const translations: Record<string, Record<Language, string>> = {
  // Nav
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.products': { ar: 'المنتجات', en: 'Products' },
  'nav.cart': { ar: 'السلة', en: 'Cart' },
  'nav.admin': { ar: 'لوحة التحكم', en: 'Admin' },

  // Hero
  'hero.title': { ar: 'ألبان وعصائر وآيس كريم منذ 1962', en: 'Dairy, Juices & Ice Cream since 1962' },
  'hero.subtitle': { ar: 'ألبان وعصائر وآيس كريم وسمنة كويتية - توصيل مجاني لكل الكويت', en: 'Kuwaiti dairy, juices, ice cream & ghee — free delivery across Kuwait' },
  'hero.cta': { ar: 'تسوّق الآن', en: 'Shop Now' },

  // Products
  'products.title': { ar: 'منتجاتنا', en: 'Our Products' },
  'products.all': { ar: 'الكل', en: 'All' },
  'products.fresh': { ar: 'مبردة', en: 'Chilled' },
  'products.frozen': { ar: 'مجمدة', en: 'Frozen' },
  'products.addToCart': { ar: 'أضف للسلة', en: 'Add to Cart' },
  'products.kwd': { ar: 'د.ك', en: 'KWD' },
  'products.outOfStock': { ar: 'نفذت الكمية', en: 'Out of Stock' },
  'products.featured': { ar: 'المنتجات المميزة', en: 'Featured Products' },
  'products.viewAll': { ar: 'عرض الكل', en: 'View All' },
  'products.details': { ar: 'تفاصيل المنتج', en: 'Product Details' },
  'products.weight': { ar: 'الوزن', en: 'Weight' },
  'products.origin': { ar: 'المصدر', en: 'Origin' },
  'products.quantity': { ar: 'الكمية', en: 'Quantity' },
  'products.description': { ar: 'الوصف', en: 'Description' },
  'products.relatedProducts': { ar: 'منتجات مشابهة', en: 'Related Products' },
  'products.search': { ar: 'ابحث عن منتج...', en: 'Search products...' },

  // Cart
  'cart.title': { ar: 'سلة التسوق', en: 'Shopping Cart' },
  'cart.empty': { ar: 'سلتك فارغة', en: 'Your cart is empty' },
  'cart.total': { ar: 'المجموع', en: 'Total' },
  'cart.subtotal': { ar: 'المجموع الفرعي', en: 'Subtotal' },
  'cart.delivery': { ar: 'التوصيل', en: 'Delivery' },
  'cart.free': { ar: 'مجاني', en: 'Free' },
  'cart.checkout': { ar: 'إتمام الشراء', en: 'Checkout' },
  'cart.continueShopping': { ar: 'متابعة التسوق', en: 'Continue Shopping' },
  'cart.remove': { ar: 'حذف', en: 'Remove' },
  'cart.coupon': { ar: 'كود خصم', en: 'Coupon Code' },
  'cart.applyCoupon': { ar: 'تطبيق', en: 'Apply' },
  'cart.discount': { ar: 'الخصم', en: 'Discount' },

  // Checkout
  'checkout.title': { ar: 'إتمام الطلب', en: 'Checkout' },
  'checkout.deliveryInfo': { ar: 'معلومات التوصيل', en: 'Delivery Information' },
  'checkout.name': { ar: 'الاسم الكامل', en: 'Full Name' },
  'checkout.phone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'checkout.area': { ar: 'المنطقة', en: 'Area' },
  'checkout.block': { ar: 'القطعة', en: 'Block' },
  'checkout.street': { ar: 'الشارع', en: 'Street' },
  'checkout.building': { ar: 'المبنى', en: 'Building' },
  'checkout.floor': { ar: 'الطابق', en: 'Floor' },
  'checkout.apartment': { ar: 'الشقة', en: 'Apartment' },
  'checkout.notes': { ar: 'ملاحظات', en: 'Notes' },
  'checkout.paymentMethod': { ar: 'طريقة الدفع', en: 'Payment Method' },
  'checkout.card': { ar: 'بطاقة ائتمانية', en: 'Credit Card' },
  'checkout.knet': { ar: 'كي نت', en: 'KNET' },
  'checkout.placeOrder': { ar: 'تأكيد الطلب', en: 'Place Order' },
  'checkout.cardNumber': { ar: 'رقم البطاقة', en: 'Card Number' },
  'checkout.expiry': { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  'checkout.cvv': { ar: 'CVV', en: 'CVV' },
  'checkout.orderSummary': { ar: 'ملخص الطلب', en: 'Order Summary' },

  // OTP
  'otp.title': { ar: 'رمز التحقق', en: 'Verification Code' },
  'otp.subtitle': { ar: 'أدخل رمز التحقق المرسل إلى هاتفك', en: 'Enter the verification code sent to your phone' },
  'otp.verify': { ar: 'تحقق', en: 'Verify' },
  'otp.resend': { ar: 'إعادة إرسال الرمز', en: 'Resend Code' },
  'otp.timer': { ar: 'إعادة الإرسال بعد', en: 'Resend in' },
  'otp.seconds': { ar: 'ثانية', en: 'seconds' },

  // Order Confirmation
  'order.confirmed': { ar: 'تم تأكيد طلبك!', en: 'Order Confirmed!' },
  'order.thankYou': { ar: 'شكراً لتسوقك من كي دي كاو', en: 'Thank you for shopping at KDCow' },
  'order.number': { ar: 'رقم الطلب', en: 'Order Number' },
  'order.trackOrder': { ar: 'تتبع الطلب', en: 'Track Order' },
  'order.backHome': { ar: 'العودة للرئيسية', en: 'Back to Home' },

  // Admin
  'admin.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'admin.products': { ar: 'المنتجات', en: 'Products' },
  'admin.orders': { ar: 'الطلبات', en: 'Orders' },
  'admin.totalSales': { ar: 'إجمالي المبيعات', en: 'Total Sales' },
  'admin.totalOrders': { ar: 'إجمالي الطلبات', en: 'Total Orders' },
  'admin.pendingOrders': { ar: 'طلبات معلقة', en: 'Pending Orders' },
  'admin.totalProducts': { ar: 'إجمالي المنتجات', en: 'Total Products' },
  'admin.approve': { ar: 'موافقة', en: 'Approve' },
  'admin.reject': { ar: 'رفض', en: 'Reject' },
  'admin.pending': { ar: 'معلق', en: 'Pending' },
  'admin.approved': { ar: 'تمت الموافقة', en: 'Approved' },
  'admin.rejected': { ar: 'مرفوض', en: 'Rejected' },
  'admin.addProduct': { ar: 'إضافة منتج', en: 'Add Product' },
  'admin.editProduct': { ar: 'تعديل منتج', en: 'Edit Product' },
  'admin.deleteProduct': { ar: 'حذف المنتج', en: 'Delete Product' },
  'admin.orderDetails': { ar: 'تفاصيل الطلب', en: 'Order Details' },
  'admin.customer': { ar: 'العميل', en: 'Customer' },
  'admin.date': { ar: 'التاريخ', en: 'Date' },
  'admin.status': { ar: 'الحالة', en: 'Status' },
  'admin.amount': { ar: 'المبلغ', en: 'Amount' },
  'admin.actions': { ar: 'الإجراءات', en: 'Actions' },

  // Footer
  'footer.about': { ar: 'عن كي دي كاو', en: 'About KDCow' },
  'footer.aboutText': { ar: 'كي دي كاو — ألبان وعصائر وآيس كريم وسمنة كويتية منذ 1962، مع توصيل مجاني لكل مناطق الكويت.', en: 'KDCow — Kuwaiti dairy, juices, ice cream and ghee since 1962, with free delivery across Kuwait.' },
  'footer.links': { ar: 'روابط سريعة', en: 'Quick Links' },
  'footer.contact': { ar: 'تواصل معنا', en: 'Contact Us' },
  'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  'footer.phone': { ar: 'الهاتف', en: 'Phone' },
  'footer.email': { ar: 'البريد', en: 'Email' },
  'footer.address': { ar: 'العنوان', en: 'Address' },

  // General
  'general.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'general.save': { ar: 'حفظ', en: 'Save' },
  'general.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'general.delete': { ar: 'حذف', en: 'Delete' },
  'general.edit': { ar: 'تعديل', en: 'Edit' },
  'general.back': { ar: 'رجوع', en: 'Back' },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('makani-lang') as Language) || 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('makani-lang', lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

