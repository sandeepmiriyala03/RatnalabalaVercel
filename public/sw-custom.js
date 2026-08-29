import { Serwist } from "serwist";

const CACHE_VERSION = "v4";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// 1. Extracted internal paths from navbar.ts
const NAVBAR_ROUTES = [
  "/",
  "/poems",
  "/mirapoems",
  "/shatakamu",
  "/smruthimala",
  "/kathamala",
  "/parabhava",
  "/aksharamala",
  "/guninta",
  "/padalamala",
  "/sametalu",
  "/sandhi",
  "/samasa",
  "/chitramala",
  "/swaramala",
  "/lipimala",
  "/khatiMala",
  "/rahasyabhasha",
  "/shailimala",
  "/geeta",
  "/test-lab",
];

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

    // Markdown content
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

    // HTML Navigation Strategy (NetworkFirst with Cache Fallback + Offline fallback)
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: PAGE_CACHE,
        networkTimeoutSeconds: 3,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

// Set global catch handler for network failures (Offline page fallback)
serwist.setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
  return Response.error();
});

serwist.addEventListeners();

// 2. Precache Offline Page AND all Navbar routes during Service Worker installation
self.addEventListener("install", (event) => {
  const routesToCache = Array.from(new Set([OFFLINE_URL, ...NAVBAR_ROUTES]));

  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(routesToCache))
  );
});