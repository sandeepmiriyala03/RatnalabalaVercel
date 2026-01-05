/* sw-custom.js – Smart, auto, future-proof Markdown offline */

/* eslint-disable no-undef */
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

/* -------------------------------------------------
   1️⃣ Precache build assets (Next.js chunks, CSS)
-------------------------------------------------- */
precacheAndRoute(self.__WB_MANIFEST);

/* -------------------------------------------------
   2️⃣ Markdown files (.md) – AUTO cache on first use
-------------------------------------------------- */
registerRoute(
  ({ url }) => url.pathname.endsWith(".md"),
  new CacheFirst({
    cacheName: "markdown-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 5000,              // supports 1000+ files
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

/* -------------------------------------------------
   3️⃣ Static assets (fonts, css, js, images)
-------------------------------------------------- */
registerRoute(
  ({ request }) =>
    ["style", "script", "image", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "asset-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

/* -------------------------------------------------
   4️⃣ API (if used)
-------------------------------------------------- */
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
  })
);

/* -------------------------------------------------
   5️⃣ Lifecycle (MANDATORY)
-------------------------------------------------- */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);
