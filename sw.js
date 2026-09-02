// FaCiLiTy PWA Service Worker
// Developed by Taohx_dz_parinya

const CACHE_NAME = 'facility-v6';
const STATIC_ASSETS = [
  './',
  './index.html',
  './img/logo.png'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // ถ้า cache บางไฟล์ไม่ได้ ไม่เป็นไร (เช่น CDN links)
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

// Fetch: Network First strategy (เน้น Online เพราะข้อมูลมาจาก Google Sheets)
self.addEventListener('fetch', event => {
  // ข้ามการ cache สำหรับ Google Apps Script API calls
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache response ที่สำเร็จไว้
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: ดึงจาก cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
