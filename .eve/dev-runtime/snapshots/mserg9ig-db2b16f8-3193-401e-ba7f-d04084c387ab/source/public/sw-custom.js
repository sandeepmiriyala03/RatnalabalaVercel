import { Serwist } from "serwist";

const CACHE_VERSION = "v2";
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
    // Static assets
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

    // Markdown
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: "CacheFirst",
      options: {
        cacheName: MARKDOWN_CACHE,
        cacheableResponse: { statuses: [0, 200] },
        expiration: {
          maxEntries: 6000,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },

    // HTML navigation — with OFFLINE FALLBACK
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: async ({ event }) => {
        try {
          return await fetch(event.request);
        } catch {
          return caches.match(OFFLINE_URL);
        }
      },
      options: {
        cacheName: PAGE_CACHE,
      },
    },
  ],
});

serwist.addEventListeners();

// Cache offline page during install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
});
