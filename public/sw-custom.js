/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = "v1";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1️⃣ Static assets
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
    // 2️⃣ Markdown poems
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: "CacheFirst",
      options: {
        cacheName: MARKDOWN_CACHE,
        cacheableResponse: { statuses: [0, 200] },
        expiration: { maxEntries: 6000, maxAgeSeconds: 31536000 },
      },
    },
    // 3️⃣ HTML navigation — OFFLINE FIRST
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: PAGE_CACHE,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
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

// 4️⃣ Pre-cache offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
});

// 5️⃣ Offline fallback (optional, Serwist already handles fallbacks)
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
