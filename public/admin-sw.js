// Service Worker للوحة تحكم كي دي دي
// يستقبل رسائل من التطبيق عبر postMessage ويعرض إشعارات أصلية على الجوال
// كما يستجيب للنقر بفتح/تركيز نافذة لوحة التحكم

const ADMIN_URL = '/admin';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// استقبال طلبات عرض الإشعارات من التطبيق
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, icon, badge, vibrate, requireInteraction } = data.payload || {};
    self.registration.showNotification(title || 'كي دي دي', {
      body: body || '',
      tag: tag || 'admin-alert',
      icon: icon || '/pwa-icon-192.png',
      badge: badge || '/pwa-icon-192.png',
      vibrate: vibrate || [200, 100, 200],
      requireInteraction: !!requireInteraction,
      renotify: true,
      lang: 'ar',
      dir: 'rtl',
      data: { url: ADMIN_URL, ts: Date.now() },
    });
  }
});

// عند النقر على الإشعار: فتح/تركيز لوحة التحكم
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || ADMIN_URL;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
