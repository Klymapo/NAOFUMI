// Service worker de NAOFUMI: abre sin conexión y busca primero la red para el radar.
const CACHE = 'naofumi-v7';
const SHELL = ['./', './index.html', './styles.css', './manifest.webmanifest', './assets/mark.svg', './assets/journey.svg', './assets/img/hoy-1600.webp', './assets/img/hoy-900.webp', './assets/img/radar.webp', './assets/img/vacio.webp', './assets/icons/icon-192.png',
  './src/app.js', './src/store.js', './src/domain.js', './src/ui.js', './src/forms.js', './src/icons.js', './src/demo.js',
  './src/integrations.js', './src/radar.js', './src/views/board.js', './src/views/detail.js', './src/views/explore.js',
  './src/views/home.js', './src/views/missions.js', './src/views/settings.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Red primero: así el código y el radar siempre llegan frescos cuando hay internet.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
