const CACHE = "scrap-app-v1";
const URLS = ["/", "/index.html", "/static/js/main.chunk.js"];

self.addEventListener("install", e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(URLS))
));

self.addEventListener("fetch", e => e.respondWith(
  caches.match(e.request).then(r => r || fetch(e.request))
));