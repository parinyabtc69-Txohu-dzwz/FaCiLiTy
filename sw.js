// FaCiLiTy PWA Service Worker
// Developed by Taohx_dz_parinya | AI Assistant: Antigravity

// ============================================================================
// 🔔 Firebase Cloud Messaging (Web Push) in Service Worker
// ============================================================================
try {
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
    console.log('[sw.js] 🔔 Background FCM Push Message received:', payload);

    // หากมี payload.notification อยู่แล้ว Firebase Messaging SDK จะแสดง Notification ให้อัตโนมัติทันที
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
      tag: (payload.data && payload.data.tag) || ('facility-fcm-' + (ticketId || Date.now())),
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
} catch (e) {
  console.warn('[sw.js] Firebase Messaging in SW note:', e);
}

const CACHE_NAME = 'facility-v1.0.3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/logo.png',
  './img/icon-192.png',
  './img/icon-512.png'
];

// Install: cache static assets (bypassing HTTP disk cache)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of STATIC_ASSETS) {
        try {
          const res = await fetch(asset, { cache: 'no-store' });
          if (res && res.ok) {
            await cache.put(asset, res);
          }
        } catch (e) {
          // ถ้า cache บางไฟล์ไม่ได้ ไม่เป็นไร
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network First strategy with disk cache busting for HTML navigations
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (
    event.request.url.includes('script.google.com') ||
    event.request.url.includes('script.googleusercontent.com') ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebaseinstallations.googleapis.com') ||
    event.request.url.includes('fcm.googleapis.com') ||
    event.request.url.includes('fcmregistrations.googleapis.com')
  ) {
    return;
  }

  // สำหรับหน้า HTML ให้ใช้ URL string พร้อม cache: 'no-store' (ห้ามส่ง Request object ที่มี mode: 'navigate' คู่กับ init เพราะจะเกิด TypeError)
  const isHtml = event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('/');
  const fetchPromise = isHtml
    ? fetch(event.request.url, { cache: 'no-store' })
    : fetch(event.request);

  event.respondWith(
    fetchPromise
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
            if (isHtml) {
              cache.put('./index.html', responseClone.clone());
            }
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});

// ============================================================================
// 🔔 Background Push Notifications & Interaction Handlers
// ============================================================================
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
