const CACHE = 'temp-pro-v11';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('temp-pro-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html') || await caches.match('./');
      const refresh = fetch(request, {cache:'no-store'}).then(async response => {
        if (response && response.ok) {
          const copy = response.clone();
          await caches.open(CACHE).then(cache => cache.put('./index.html', copy));
        }
        return response;
      });
      if (cached) { event.waitUntil(refresh.then(()=>{}).catch(()=>{})); return cached; }
      try { return await refresh; } catch(e) { return Response.error(); }
    })());
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok) { const copy=response.clone(); event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})); }
    return response;
  })));
});
