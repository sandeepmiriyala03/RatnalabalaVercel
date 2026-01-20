import {
  Serwist,
  CacheFirst,
  NetworkFirst,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision?: string }>;
};

const CACHE_VERSION = "v1";

const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const FONT_CACHE = `font-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline.html";

const serwist = new Serwist({
  precacheEntries: [
    { url: "/", revision: CACHE_VERSION },
    { url: OFFLINE_URL, revision: CACHE_VERSION },
    ...self.__SW_MANIFEST,
  ],

  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    // -------------------------------
    // Fonts (public/Fonts/*)
    // -------------------------------
    {
      matcher: ({ request }) => request.destination === "font",
      handler: new CacheFirst({
        cacheName: FONT_CACHE,
      }),
    },

    // -------------------------------
    // Static assets (CSS, JS, images)
    // -------------------------------
    {
      matcher: ({ request }) =>
        ["style", "script", "image"].includes(request.destination),
      handler: new CacheFirst({
        cacheName: ASSET_CACHE,
      }),
    },

    // -------------------------------
    // Markdown poems (.md)
    // -------------------------------
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: new CacheFirst({
        cacheName: MARKDOWN_CACHE,
      }),
    },

    // -------------------------------
    // HTML navigation (offline fallback)
    // -------------------------------
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: PAGE_CACHE,
      }),
    },
  ],
});

serwist.addEventListeners();

// -------------------------------
// Ensure offline.html cached
// -------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
});
