/* sw-custom.js – Ratnalabala (FINAL) */

/* eslint-disable no-undef */
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

/* -------------------------------------------------
   🔑 1. PRECACHE (THIS IS CRITICAL)
-------------------------------------------------- */
precacheAndRoute([
  { url: "/", revision: null },   // 👈 REQUIRED for offline
  ...self.__WB_MANIFEST,
]);

/* -------------------------------------------------
   🔑 2. OFFLINE NAVIGATION HANDLER
-------------------------------------------------- */
registerRoute(
  ({ request }) => request.mode === "navigate",
  async () => {
    const cache = await caches.open("workbox-precache-v2");
    const cached = await cache.match("/");
    return cached || Response.error();
  }
);

/* -------------------------------------------------
   🎨 3. STATIC ASSETS
-------------------------------------------------- */
registerRoute(
  ({ request }) =>
    ["image", "style", "script", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "asset-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

/* -------------------------------------------------
   🌐 4. API CACHE
-------------------------------------------------- */
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
  })
);

/* -------------------------------------------------
   ⚡ 5. LIFECYCLE (MANDATORY)
-------------------------------------------------- */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
