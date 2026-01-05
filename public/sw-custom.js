/* sw-custom.js – FINAL, App Router safe */

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

/* 🔑 PRECACHE */
precacheAndRoute([
  { url: "/offline.html", revision: null },
  ...self.__WB_MANIFEST,
]);

/* 🔑 OFFLINE NAVIGATION HANDLER */
registerRoute(
  ({ request }) => request.mode === "navigate",
  async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open("workbox-precache-v2");
      return cache.match("/offline.html");
    }
  }
);

/* 🎨 ASSETS */
registerRoute(
  ({ request }) =>
    ["image", "style", "script", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "asset-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

/* 🌐 API */
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api-cache" })
);

/* ⚡ LIFECYCLE */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(self.clients.claim())
);
