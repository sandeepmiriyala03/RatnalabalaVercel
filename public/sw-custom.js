/* sw-custom.js – Ratnalabala Offline PWA (Next.js 16 Safe) */

// 1. Load Workbox
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

if (workbox) {
  console.log("✅ Workbox loaded");

  const { registerRoute } = workbox.routing;
  const { CacheFirst, NetworkFirst } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheable_response;
  const { ExpirationPlugin } = workbox.expiration;

  // 2. Static assets (CSS, JS, Images, Fonts)
  registerRoute(
    ({ request }) =>
      ["style", "script", "image", "font"].includes(request.destination),
    new CacheFirst({
      cacheName: "asset-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 300 }),
      ],
    })
  );

  // 3. Telugu poems (.md)
  registerRoute(
    ({ url }) => url.pathname.endsWith(".md"),
    new CacheFirst({
      cacheName: "markdown-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 5000,
          maxAgeSeconds: 31536000, // 1 year
        }),
      ],
    })
  );

  // 4. API routes
  registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 5,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 86400, // 24h
        }),
      ],
    })
  );

  // 5. Page navigation (HTML)
  registerRoute(
    ({ request }) => request.mode === "navigate",
    new NetworkFirst({
      cacheName: "pages-cache",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );
}

// 6. Offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open("pages-cache");
        const offline = await cache.match("/offline.html");

        return (
          offline ||
          new Response("Offline: Connect to read poems", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          })
        );
      })
    );
  }
});

// 7. Lifecycle
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
