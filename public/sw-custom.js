/* sw-custom.js – Ratnalabala Offline PWA */
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

// 1. Precache Next.js + offline.html
precacheAndRoute(self.__WB_MANIFEST);

// 2. Telugu poems (.md) cache
registerRoute(
  ({ url }) => url.pathname.endsWith(".md"),
  new CacheFirst({
    cacheName: "markdown-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 5000, maxAgeSeconds: 31536000 }),
    ],
  })
);

// 3. Static assets
registerRoute(
  ({ request }) => ["style", "script", "image", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "asset-cache",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// 4. API cache
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 })],
  })
);

// 5. Navigation fallback → offline.html
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages-cache",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// 6. LIFECYCLE (single source of truth)
self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// 7. EXPLICIT offline.html fallback
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open("pages-cache");
        const offline = await cache.match("/offline.html");
        return offline || new Response("Offline: Connect to read poems", {
          status: 200,
          headers: { "Content-Type": "text/html" }
        });
      })
    );
  }
});
