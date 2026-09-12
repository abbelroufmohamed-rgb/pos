// غيّر رقم النسخة (v2, v3, ...) بعد أي تحديث كبير — هذا يجبر تحديث الكاش القديم
const CACHE_NAME = 'pos-cache-v1';
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // صفحة index.html: نجرب الشبكة أولاً دايماً عشان أي تحديث يظهر فوراً،
  // ولو ما فيه نت نرجع لآخر نسخة محفوظة (عشان يشتغل بدون اتصال)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // ملفات ثابتة (أيقونات، manifest): كاش أولاً ثم الشبكة
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
