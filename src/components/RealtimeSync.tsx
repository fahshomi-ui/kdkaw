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
