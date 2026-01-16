/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

/**
 * NOTE:
 * Service workers MUST be plain JavaScript.
 * No TypeScript, no `declare`, no `import type`.
 */

// --- Cache names ---
const CACHE_VERSION = "v2";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// --- Serwist config ---
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    // 1️⃣ Static assets (JS, CSS, images, fonts)
    {
      matcher: ({ request }) =>
        ["style", "script", "image", "font"].includes(request.destination),
      handler: "CacheFirst",
      options: {
        cacheName: ASSET_CACHE,
        cacheableResponse: { statuses: [0, 200] },
        expiration: { maxEntries: 300 },
      },
    },

    // 2️⃣ Markdown files (.md)
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: "CacheFirst",
      options: {
        cacheName: MARKDOWN_CACHE,
        cacheableResponse: { statuses: [0, 200] },
        expiration: {
          maxEntries: 6000,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },

    // 3️⃣ HTML navigation
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: PAGE_CACHE,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],

  // 4️⃣ Offline fallback
  fallbacks: {
    entries: [
      {
        url: OFFLINE_URL,
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// --- Install: cache offline page ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
});

// --- Activate: claim clients ---
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
