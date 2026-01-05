/* sw-custom.js – Smart, auto, future-proof Markdown offline for Ratnalabala PWA */
/* eslint-disable no-undef */
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

/* -------------------------------------------------
   1️⃣ Precache build assets (Next.js chunks, CSS, offline.html, manifest)
-------------------------------------------------- */
precacheAndRoute(self.__WB_MANIFEST);

/* -------------------------------------------------
   2️⃣ Markdown files (.md) – AUTO cache on first use (Telugu poems)
-------------------------------------------------- */
registerRoute(
  ({ url }) => url.pathname.endsWith(".md"),
  new CacheFirst({
    cacheName: "markdown-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 5000,              // supports 1000+ poem files
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
   4️⃣ API routes – Network first with short expiration
-------------------------------------------------- */
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  })
);

/* -------------------------------------------------
   5️⃣ Navigation routes – Pages with offline fallback
-------------------------------------------------- */
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

/* -------------------------------------------------
   6️⃣ Offline fallback to offline.html for uncached navigations
-------------------------------------------------- */
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate" && !event.request.url.includes("localhost")) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open("pages-cache");
        return cache.match("/offline.html") || 
               new Response("Offline mode: Poems available via search", {
                 status: 200,
                 headers: { "Content-Type": "text/html" }
               });
      })
    );
  }
});

/* -------------------------------------------------
   7️⃣ Lifecycle (MANDATORY for instant updates)
-------------------------------------------------- */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);
