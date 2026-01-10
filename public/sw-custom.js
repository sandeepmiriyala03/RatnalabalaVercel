/* sw-custom.js – Ratnalabala Offline PWA */

// 1. Load Workbox from Google CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// 2. Destructure Workbox modules for easier use
const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheable_response;
const { ExpirationPlugin } = workbox.expiration;

// 3. Precache Next.js build files + offline.html
// This line MUST be present for InjectManifest to work correctly
precacheAndRoute(self.__WB_MANIFEST);

// 4. Telugu poems (.md) cache - Long term storage
registerRoute(
  ({ url }) => url.pathname.endsWith(".md"),
  new CacheFirst({
    cacheName: "markdown-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ 
        maxEntries: 5000, 
        maxAgeSeconds: 31536000 // 1 year
      }),
    ],
  })
);

// 5. Static assets (Styles, Scripts, Images)
registerRoute(
  ({ request }) => ["style", "script", "image", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "asset-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ],
  })
);

// 6. API cache - Network First (Try internet first, then cache)
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }) // 24 hours
    ],
  })
);

// 7. Navigation fallback for Pages
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ],
  })
);

// 8. SERVICE WORKER LIFECYCLE
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 9. EXPLICIT OFFLINE FALLBACK
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open("pages-cache");
        const offline = await cache.match("/offline.html");
        
        // Return offline.html if cached, otherwise return a simple text fallback
        return offline || new Response("Offline: Connect to read poems", {
          status: 200,
          headers: { "Content-Type": "text/html" }
        });
      })
    );
  }
});