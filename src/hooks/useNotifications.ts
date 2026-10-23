import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'mk_notifications_v1';
const READ_KEY = 'mk_notifications_read_at';
const PHONE_KEY = 'mk_last_phone';
const MAX = 30;

export interface NotificationItem {
  id: string;
  order_number: string;
  status: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  created_at: string;
}

const STATUS_TITLES: Record<string, { ar: string; en: string; body_ar: string; body_en: string }> = {
  pending: { ar: 'تم استلام طلبك', en: 'Order received', body_ar: 'سنبدأ بمعالجته فوراً', body_en: 'We will start processing it shortly' },
  confirmed: { ar: 'تم تأكيد طلبك', en: 'Order confirmed', body_ar: 'طلبك في طريقه إلى التحضير', body_en: 'Your order is being prepared' },
  preparing: { ar: 'جارٍ تحضير طلبك 👨‍🍳', en: 'Preparing your order 👨‍🍳', body_ar: 'فريقنا يعمل على طلبك الآن', body_en: 'Our team is working on it' },
  out_for_delivery: { ar: 'طلبك في الطريق 🚚', en: 'Out for delivery 🚚', body_ar: 'سيصلك خلال وقت قصير', body_en: 'Arriving soon' },
  delivered: { ar: 'تم توصيل طلبك ✅', en: 'Order delivered ✅', body_ar: 'بالعافية! نتطلع لطلبك القادم', body_en: 'Enjoy! We look forward to next time' },
  cancelled: { ar: 'تم إلغاء طلبك', en: 'Order cancelled', body_ar: 'تواصل معنا لمزيد من التفاصيل', body_en: 'Please contact us for details' },
};

const readList = (): NotificationItem[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const writeList = (list: NotificationItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX)));
  window.dispatchEvent(new Event('mk-notifications-changed'));
};

export const pushNotification = (n: Omit<NotificationItem, 'id' | 'created_at'> & { id?: string; created_at?: string }) => {
  const item: NotificationItem = {
    id: n.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: n.created_at || new Date().toISOString(),
    order_number: n.order_number,
    status: n.status,
    title_ar: n.title_ar, title_en: n.title_en,
    body_ar: n.body_ar, body_en: n.body_en,
  };
  const list = readList();
  if (list.find((x) => x.order_number === item.order_number && x.status === item.status)) return;
  writeList([item, ...list]);
  // Browser notification
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification(item.title_ar, { body: item.body_ar, icon: '/favicon.ico' }); } catch {}
  }
};

export const setLastPhone = (phone: string) => {
  if (phone && phone.trim()) localStorage.setItem(PHONE_KEY, phone.trim());
};

export const useNotifications = () => {
  const [list, setList] = useState<NotificationItem[]>(() => readList());
  const [readAt, setReadAt] = useState<number>(() => Number(localStorage.getItem(READ_KEY) || 0));

  useEffect(() => {
    const onChange = () => {
      setList(readList());
      setReadAt(Number(localStorage.getItem(READ_KEY) || 0));
    };
    window.addEventListener('mk-notifications-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('mk-notifications-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const markAllRead = useCallback(() => {
    const ts = Date.now();
    localStorage.setItem(READ_KEY, String(ts));
    setReadAt(ts);
    window.dispatchEvent(new Event('mk-notifications-changed'));
  }, []);

  const clearAll = useCallback(() => {
    writeList([]);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'default') {
      try { return await Notification.requestPermission(); } catch { return 'denied'; }
    }
    return Notification.permission;
  }, []);

  const unreadCount = list.filter((n) => new Date(n.created_at).getTime() > readAt).length;

  return { list, unreadCount, markAllRead, clearAll, requestPermission };
};

/** Subscribes to realtime status updates for the current customer phone. */
export const useOrderRealtimeListener = () => {
  useEffect(() => {
    const phone = localStorage.getItem(PHONE_KEY);
    if (!phone) return;

    const channel = supabase
      .channel(`customer-orders-${phone}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_phone=eq.${phone}` },
        (payload) => {
          const o: any = payload.new;
          const meta = STATUS_TITLES[o.status];
          if (!meta) return;
          pushNotification({
            order_number: o.order_number,
            status: o.status,
            title_ar: meta.ar, title_en: meta.en,
            body_ar: `${meta.body_ar} — طلب #${o.order_number}`,
            body_en: `${meta.body_en} — Order #${o.order_number}`,
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `customer_phone=eq.${phone}` },
        (payload) => {
          const o: any = payload.new;
          pushNotification({
            order_number: o.order_number,
            status: o.status || 'pending',
            title_ar: 'تم استلام طلبك 🎉', title_en: 'Order received 🎉',
            body_ar: `طلبك #${o.order_number} قيد المعالجة`,
            body_en: `Order #${o.order_number} is being processed`,
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
};