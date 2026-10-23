import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  show: boolean;
  onClose: () => void;
  /** 'card' = نمط حديث (بطاقة) | 'knet' = نمط K-Net الكلاسيكي */
  variant?: 'card' | 'knet';
  /** مدة الإغلاق التلقائي بالميلي ثانية. 0 لتعطيل. الافتراضي 3000 */
  autoCloseMs?: number;
  /** هامش خارجي مخصص (اختياري) */
  style?: React.CSSProperties;
}

/**
 * بانر تنبيه أحمر يظهر عند رفض المعلومات من قبل الأدمن.
 * - قابل للإغلاق يدوياً بزر X
 * - يختفي تلقائياً بعد 3 ثوانٍ
 */
const PaymentRejectionBanner = ({
  show,
  onClose,
  variant = 'card',
  autoCloseMs = 3000,
  style,
}: Props) => {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show || autoCloseMs <= 0) return;
    const t = setTimeout(() => {
      setVisible(false);
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(t);
  }, [show, autoCloseMs, onClose]);

  if (!visible) return null;

  const isKnet = variant === 'knet';
  const message =
    lang === 'ar'
      ? 'المعلومات المدخلة غير صحيحة، يرجى المحاولة مرة أخرى'
      : 'The entered information is incorrect, please try again';

  const containerStyle: React.CSSProperties = isKnet
    ? {
        padding: '6px 10px',
        borderRadius: '3px',
        backgroundColor: '#fff3f3',
        border: '1px solid #ffcccc',
      }
    : {
        padding: '8px 10px',
        borderRadius: '6px',
        backgroundColor: 'rgba(244,67,54,0.08)',
        border: '1px solid rgba(244,67,54,0.3)',
      };

  const color = isKnet ? '#cc0000' : '#f44336';
  const fontFamily = isKnet ? 'Verdana, Geneva, sans-serif' : 'Cairo, sans-serif';

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        animation: 'pulse-error 0.4s ease-out',
        ...containerStyle,
        ...style,
      }}
    >
      <AlertCircle size={14} color={color} style={{ flexShrink: 0 }} />
      <span
        style={{
          fontSize: '10px',
          color,
          fontFamily,
          fontWeight: 'bold',
          flex: 1,
        }}
      >
        {message}
      </span>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onClose();
        }}
        aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default PaymentRejectionBanner;
