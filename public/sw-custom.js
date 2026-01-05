/* eslint-disable no-undef */
/* sw-custom.js – Ratnalabala */

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

/**
 * 🔴 THIS LINE IS MANDATORY
 * Workbox injects build-time assets here
 */
precacheAndRoute(self.__WB_MANIFEST);

/* =========================
   📄 Pages / Navigation
========================= */
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages-cache",
    networkTimeoutSeconds: 5,
  })
);

/* =========================
   🎨 JS / CSS / Images
========================= */
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "static-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

/* =========================
   🔤 Fonts
========================= */
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({
    cacheName: "font-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

/* =========================
   🔊 Audio
========================= */
registerRoute(
  ({ request }) => request.destination === "audio",
  new CacheFirst({
    cacheName: "audio-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

/* =========================
   🎥 Video
========================= */
registerRoute(
  ({ request }) => request.destination === "video",
  new CacheFirst({
    cacheName: "video-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  })
);

/* =========================
   🌐 APIs
========================= */
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24,
      }),
    ],
  })
);

/* =========================
   ⚡ Lifecycle
========================= */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
