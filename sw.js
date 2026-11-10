// FaCiLiTy PWA Service Worker
// Developed by Taohx_dz_parinya

const CACHE_NAME = 'facility-v6.34-maintenance';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/logo.png',
  './img/icon-192.png',
  './img/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // ถ้า cache บางไฟล์ไม่ได้ ไม่เป็นไร
      });
    })
  );
  self.skipWaiting();
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
  if (
    event.request.url.includes('script.google.com') ||
    event.request.url.includes('script.googleusercontent.com') ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebaseinstallations.googleapis.com')
  ) {
    return;
  }

  // สำหรับหน้า HTML ให้ข้าม HTTP disk cache เพื่อให้เบราว์เซอร์ตรวจสอบไฟล์เวอร์ชันล่าสุดเสมอ
  const isHtml = event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('/');
  const fetchPromise = isHtml
    ? fetch(event.request, { cache: 'no-cache' })
    : fetch(event.request);

  event.respondWith(
    fetchPromise
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
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
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'FaCiLiTy แจ้งเตือน', body: event.data.text() };
    }
  }

  const title = data.title || 'FaCiLiTy • มีการแจ้งเตือนใหม่';
  const options = {
    body: data.body || 'มีงานแจ้งซ่อมหรืออัปเดตใหม่ในระบบ',
    icon: data.icon || './img/icon-192.png',
    badge: data.badge || './img/logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './',
      ticketId: data.ticketId || ''
    },
    actions: [
      { action: 'open', title: 'เปิดดูงาน' },
      { action: 'close', title: 'ปิด' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes('FaCiLiTy') && 'focus' in client) {
          if ('navigate' in client) {
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
