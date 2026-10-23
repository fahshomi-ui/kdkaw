import { waitingMessage } from "@/lib/store";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, useState } from "react";

// Signals لتخزين معلومات البطاقة للعرض في شاشة الانتظار
export const waitingCardInfo = signal<{
  bankName?: string;
  bankLogo?: string;
  cardType?: string;
} | null>(null);

// Signal لتخزين معلومات مزود الخدمة ورقم الهاتف
export const waitingProviderInfo = signal<{
  providerLogo?: string;
  providerName?: string;
  phoneNumber?: string;
} | null>(null);

// الحصول على شعار نوع البطاقة
function getCardTypeLogo(type?: string): string | null {
  switch (type?.toLowerCase()) {
    case "mada":
      return "/images/mada.png";
    case "visa":
      return "/images/visa.png";
    case "mastercard":
      return "/images/mastercard.png";
    default:
      return null;
  }
}

// مكون العداد التنازلي
function CountdownTimer() {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          return 60; // إعادة العد من البداية
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // تنسيق الوقت كدقيقة:ثانية
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="text-sm text-gray-500" dir="ltr">
      {formattedTime}
    </div>
  );
}

export default function WaitingOverlay() {
  useSignals();
  
  // قراءة القيم مباشرة من الـ signals
  const message = waitingMessage.value;
  const cardInfo = waitingCardInfo.value;
  const providerInfo = waitingProviderInfo.value;
  
  if (!message) return null;

  const cardTypeLogo = cardInfo?.cardType ? getCardTypeLogo(cardInfo.cardType) : null;
  const bankLogo = cardInfo?.bankLogo;
  const bankName = cardInfo?.bankName;
  const providerLogo = providerInfo?.providerLogo;
  const phoneNumber = providerInfo?.phoneNumber;

  return (
    <div className="kdd-ov">
      <style>{"@keyframes kddspin{to{transform:rotate(360deg)}}.kdd-ov{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999}.kdd-ov-card{background:#fff;border-radius:14px;padding:28px 32px;display:flex;flex-direction:column;align-items:center;gap:16px;min-width:300px;max-width:92vw;box-shadow:0 10px 40px rgba(0,0,0,.25);box-sizing:border-box}.kdd-spin{width:44px;height:44px;border:4px solid #16a34a;border-top-color:transparent;border-radius:50%;animation:kddspin .8s linear infinite}"}</style>
      <div className="kdd-ov-card">
        
        {/* شعارات البنك ونوع البطاقة في الأعلى - تظهر فقط إذا كانت موجودة */}
        {(bankLogo || cardTypeLogo) && (
          <div className="w-full flex justify-between items-center mb-4" style={{ minHeight: '32px' }}>
            {/* شعار البنك - أعلى اليسار */}
            <div className="flex items-center justify-start">
              {bankLogo ? (
                <img 
                  src={bankLogo} 
                  alt={bankName || "Bank"} 
                  className="h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
            
            {/* شعار نوع البطاقة - أعلى اليمين */}
            <div className="flex items-center justify-end">
              {cardTypeLogo ? (
                <img 
                  src={cardTypeLogo} 
                  alt={cardInfo?.cardType || "Card"} 
                  className="h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* شعار مزود الخدمة في المنتصف */}
        {providerLogo && (
          <div className="flex flex-col items-center gap-2 mb-2">
            <img 
              src={providerLogo} 
              alt="Service Provider" 
              className="h-12 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {phoneNumber && (
              <p className="text-gray-600 text-sm font-medium" dir="ltr">{phoneNumber}</p>
            )}
          </div>
        )}

        {/* Spinner */}
        <div className="kdd-spin" />
        
        <p style={{ color: "#374151", textAlign: "center", fontWeight: 500, fontSize: 14, lineHeight: 1.7 }}>
          {message}
        </p>

        {/* العداد التنازلي */}
        <CountdownTimer />
      </div>
    </div>
  );
}
