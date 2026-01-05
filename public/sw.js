const CACHE_NAME = "ratnalabala-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/Images/CartoonStyle.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  // 🧠 Cache poems API
  if (event.request.url.includes("/api/poems")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const res = await fetch(event.request);
          cache.put(event.request, res.clone());
          return res;
        } catch {
          return cache.match(event.request);
        }
      })
    );
    return;
  }

  if (event.request.url.includes("/api/mirapoems")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const res = await fetch(event.request);
          cache.put(event.request, res.clone());
          return res;
        } catch {
          return cache.match(event.request);
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
