const CACHE = 'myenglish-v14';
const SHELL = ['./', './index.html', './styles.css', './data.js', './app.js', './listening.js', './avatars.js', './topics.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' evita que el navegador entregue archivos viejos guardados
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts')) return; // IA: siempre red
  if (url.origin === location.origin) {
    // Red primero (para recibir actualizaciones), caché si no hay conexión
    e.respondWith(fetch(new Request(e.request.url, { cache: 'no-store' })).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    })));
  }
});
