/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// --- Types ---
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- Cache names ---
const CACHE_VERSION = "v1";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// --- Serwist config ---
const serwist = new Serwist({
  // Precache all static assets (JS, CSS, images, fonts, icons) from Next.js build
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1️⃣ Static assets (JS, CSS, images, fonts, icons from public/)
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
    // 2️⃣ Markdown poems (all .md files in poems/, mirapoems/, content/, etc.)
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: "CacheFirst",
      options: {
        cacheName: MARKDOWN_CACHE,
        cacheableResponse: { statuses: [0, 200] },
        expiration: { maxEntries: 6000, maxAgeSeconds: 31536000 }, // 1 year
      },
    },
    // 3️⃣ HTML navigation (all pages: /, /poems, /mirapoems, /shatakamu, /chitramala, etc.)
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: PAGE_CACHE,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
  // 4️⃣ Offline fallback: any HTML page that fails → offline.html
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

// --- Install: pre-cache offline.html ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
});

// --- Activate: claim all clients ---
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
