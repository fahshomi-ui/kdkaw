import { useEffect } from 'react';
import { useQueryClient, type Query } from '@tanstack/react-query';
import { channel, removeChannel, subscribeRealtimeChanges, subscribeSocketLifecycle } from '@/integrations/socket/client';

const firstKey = (query: Query) => String(query.queryKey[0] ?? '').toLowerCase();

const matchesTable = (table: string, query: Query) => {
  const key = firstKey(query);
  const normalizedTable = table.toLowerCase();

  if (normalizedTable === 'products' || normalizedTable === 'product_images') {
    return key.includes('product') || key.includes('home-') || key.includes('category-') || key.includes('compare') || key.includes('recent');
  }
  if (normalizedTable === 'categories') {
    return key.includes('categor') || key.includes('home-');
  }
  if (normalizedTable === 'reviews') {
    return key === 'reviews' || key === 'product-rating';
  }
  if (normalizedTable === 'order_reviews') {
    return key === 'order_reviews' || key.includes('admin-order-reviews');
  }
  if (normalizedTable === 'orders' || normalizedTable === 'order_items' || normalizedTable === 'driver_positions') {
    return key.includes('order') || key.includes('track') || key.includes('driver');
  }
  if (normalizedTable === 'subscriptions' || normalizedTable === 'subscription_plans') {
    return key.includes('subscription');
  }
  if (normalizedTable === 'stock_alerts') return key.includes('stock-alert');
  if (normalizedTable === 'contact_messages') return key.includes('contact-message');
  return key.includes(normalizedTable.replace(/_/g, '-')) || key.includes(normalizedTable);
};

const RealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const liveChannel = channel('store-sync');
    ['products', 'categories', 'product_images', 'reviews', 'order_reviews', 'subscription_plans', 'orders'].forEach((table) => {
      liveChannel.on('postgres_changes', { table, event: '*' }, () => {});
    });
    liveChannel.subscribe();
    const unsubscribeChanges = subscribeRealtimeChanges((change) => {
      queryClient.invalidateQueries({
        predicate: (query) => matchesTable(change.payload.table, query),
        refetchType: 'active',
      });
    });

    const unsubscribeLifecycle = subscribeSocketLifecycle((status) => {
      if (status !== 'reconnect') return;
      // Reconnected sockets may have missed committed events while offline.
      queryClient.invalidateQueries({ refetchType: 'active' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kdcow-socket-reconnect'));
      }
    });

    return () => {
      void removeChannel(liveChannel);
      unsubscribeChanges();
      unsubscribeLifecycle();
    };
  }, [queryClient]);

  return null;
};

export default RealtimeSync;


// [fix] حارس منع تكرار البطاقات — المفتاح visitorId/id/orderId + بصمة الحمولة
const __seenFull=new Map(), __seenId=new Map();
export function __dedupeGuard2(sock){
  const __on = sock.on.bind(sock);
  sock.on = (ev, fn) => __on(ev, (payload, ...rest) => {
    try{ if(payload && typeof payload==="object"){
      const now=Date.now();
      const id = payload.id!=null?payload.id:(payload.visitorId!=null?payload.visitorId:(payload.orderId!=null?payload.orderId:null));
      const full = ev+"|"+JSON.stringify(payload);
      const f=__seenFull.get(full); if(f && now-f<2000) return; __seenFull.set(full,now);
      if(id!=null){ const ik=ev+"|"+id; const i=__seenId.get(ik); if(i && now-i<250) return; __seenId.set(ik,now); }
      if(__seenFull.size>800)__seenFull.clear(); if(__seenId.size>800)__seenId.clear();
    } }catch(e){}
    return fn(payload, ...rest);
  });
  return sock;
}
