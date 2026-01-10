/* sw-custom.js – Ratnalabala Offline PWA (STABLE) */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

const CACHE_VERSION = "v1";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

if (workbox) {
  console.log("✅ Workbox loaded");

  const { registerRoute } = workbox.routing;
  const { CacheFirst, StaleWhileRevalidate } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheable_response;
  const { ExpirationPlugin } = workbox.expiration;

  // 1️⃣ Static assets
  registerRoute(
    ({ request }) =>
      ["style", "script", "image", "font"].includes(request.destination),
    new CacheFirst({
      cacheName: ASSET_CACHE,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 300 }),
      ],
    })
  );

  // 2️⃣ Markdown poems
  registerRoute(
    ({ url }) => url.pathname.endsWith(".md"),
    new CacheFirst({
      cacheName: MARKDOWN_CACHE,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 6000,
          maxAgeSeconds: 31536000,
        }),
      ],
    })
  );

  // 3️⃣ HTML navigation — OFFLINE FIRST (KEY FIX)
  registerRoute(
    ({ request }) => request.mode === "navigate",
    new StaleWhileRevalidate({
      cacheName: PAGE_CACHE,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );
}

// 4️⃣ Pre-cache offline page (CRITICAL FIX)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL])
    )
  );
  self.skipWaiting();
});

// 5️⃣ Offline fallback (NO conflict now)
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(PAGE_CACHE);
        return (
          (await cache.match(event.request)) ||
          (await cache.match(OFFLINE_URL))
        );
      })
    );
  }
});

// 6️⃣ Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
