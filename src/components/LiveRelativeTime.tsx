import { useEffect, useState } from 'react';

/**
 * مؤقت ذاتي التحديث يعرض "قبل X ثانية/دقيقة/ساعة/يوم".
 * يعمل بشكل مستقل عن state الأب، لذا لا يتجمد على الجوال
 * حتى عند وجود تحديثات realtime ثقيلة في الصفحة.
 */
interface Props {
  iso: string;
  lang: 'ar' | 'en';
  className?: string;
}

const format = (diff: number, lang: 'ar' | 'en') => {
  if (lang === 'ar') {
    if (diff < 5) return 'الآن';
    if (diff < 60) return `قبل ${diff} ث`;
    if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
    return `قبل ${Math.floor(diff / 86400)} ي`;
  }
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const LiveRelativeTime = ({ iso, lang, className }: Props) => {
  const target = new Date(iso).getTime();
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    const id = window.setInterval(() => {
      if (mounted) setTick((t) => (t + 1) % 1_000_000);
    }, 1000);
    // أعد التشغيل عند العودة إلى التبويب (الموبايل يوقف setInterval في الخلفية)
    const onVisible = () => { if (document.visibilityState === 'visible') setTick((t) => t + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const diff = Math.max(0, Math.floor((Date.now() - target) / 1000));
  return <span className={className}>{format(diff, lang)}</span>;
};

export default LiveRelativeTime;

/**
 * Hook ذاتي التحديث: يُعيد render للمكوّن المستضيف كل ثانية فقط
 * (دون التأثير على بقية الصفحة). استخدمه داخل مكوّن صغير معزول.
 */
export const useTick = (intervalMs: number = 1000) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    let mounted = true;
    const id = window.setInterval(() => {
      if (mounted) setTick((t) => (t + 1) % 1_000_000);
    }, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') setTick((t) => t + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
};