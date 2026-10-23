import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizePhone, syncVisitorIdentity, getVisitorSessionId } from '@/lib/visitorIdentity';

export const useStockAlert = (productId: string, lang: 'ar' | 'en' = 'ar') => {
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async (contact: string) => {
    const trimmed = contact.trim();
    if (trimmed.length < 5) {
      toast.error(lang === 'ar' ? 'الرجاء إدخال رقم هاتف أو بريد صحيح' : 'Please enter a valid phone or email');
      return false;
    }
    const isEmail = /\S+@\S+\.\S+/.test(trimmed);
    const storedContact = isEmail ? trimmed : normalizePhone(trimmed);
    setSubmitting(true);
    try {
      const { error } = await supabase.from('stock_alerts').insert({
        product_id: productId,
        contact: storedContact,
        contact_type: isEmail ? 'email' : 'phone',
        lang,
        visitor_session_id: getVisitorSessionId(),
      } as any);
      if (error) {
        // Unique constraint violation = already subscribed
        if (error.code === '23505') {
          setSubscribed(true);
          toast.success(lang === 'ar' ? 'أنت مسجّل بالفعل لهذا المنتج' : "You're already subscribed for this product");
          return true;
        }
        throw error;
      }
      setSubscribed(true);
      // مزامنة الهاتف أو الإيميل مع جلسة الزائر الحالية لربط التنبيه ببطاقته في لوحة التحكم
      if (isEmail) {
        await syncVisitorIdentity({ email: storedContact });
      } else {
        await syncVisitorIdentity({ phone: storedContact });
      }
      toast.success(
        lang === 'ar'
          ? 'تم! سنُبلّغك فور توفر المنتج'
          : "Done! We'll notify you when it's back in stock"
      );
      return true;
    } catch (e: any) {
      toast.error(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { subscribe, submitting, subscribed };
};
