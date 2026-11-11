// ============================================================================
// 🔔 FaCiLiTy Firebase Cloud Messaging Background Service Worker
// Developed by Taohx_dz_parinya | AI Assistant: Antigravity
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyAmpHXVA34dm12Hoxet55PjKkDD5Io-B48",
  projectId: "facility-c7833",
  messagingSenderId: "642207526987",
  appId: "1:642207526987:web:253a2790f43062097c5dce"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  console.log('[firebase-messaging-sw.js] 🔔 Background Push Message received:', payload);

  if (payload && payload.notification && (payload.notification.title || payload.notification.body)) {
    return;
  }

  const title = (payload.data && payload.data.title) ||
                'FaCiLiTy • มีการแจ้งเตือนใหม่';

  const body = (payload.data && payload.data.body) ||
               'มีงานแจ้งซ่อมหรืออัปเดตใหม่ในระบบ';

  const ticketId = (payload.data && payload.data.ticketId) || '';
  const url = ticketId ? ('./?ticketId=' + encodeURIComponent(ticketId)) : ((payload.data && payload.data.url) || './');

  const options = {
    body: body,
    icon: './img/icon-192.png',
    badge: './img/logo.png',
    vibrate: [200, 100, 200, 100, 250],
    tag: payload.data?.tag || ('facility-fcm-' + (ticketId || Date.now())),
    renotify: true,
    data: {
      url: url,
      ticketId: ticketId
    },
    actions: [
      { action: 'open', title: 'เปิดดูงาน' },
      { action: 'close', title: 'ปิด' }
    ]
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;

  const notifData = (event.notification && event.notification.data) || {};
  const fcmData = (notifData.FCM_MSG && notifData.FCM_MSG.data) || notifData;
  const ticketId = fcmData.ticketId || '';
  const targetUrl = ticketId
    ? ('./?ticketId=' + encodeURIComponent(ticketId))
    : (fcmData.url || './');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes('FaCiLiTy') && 'focus' in client) {
          if (ticketId && 'navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

