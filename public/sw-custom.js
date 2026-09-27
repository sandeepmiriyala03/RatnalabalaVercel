import { Serwist } from "serwist";

const CACHE_VERSION = "v6";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const ACTIVE_CACHE_NAMES = new Set([PAGE_CACHE, ASSET_CACHE, MARKDOWN_CACHE]);

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
  // self.__SW_MANIFEST is automatically injected by Serwist during build
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    // Ignore Vercel Analytics and Speed Insights calls
    {
      matcher: ({ url }) => url.pathname.startsWith("/_vercel/"),
      handler: "NetworkOnly",
    },

    // Static Assets
    {
      matcher: ({ request, url }) =>
        ["style", "script", "image", "font"].includes(request.destination) &&
        !url.pathname.startsWith("/_vercel/"),
      handler: "CacheFirst",
      options: {
        cacheName: ASSET_CACHE,
        cacheableResponse: { statuses: [200] },
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },

    // Markdown files
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: "CacheFirst",
      options: {
        cacheName: MARKDOWN_CACHE,
        cacheableResponse: { statuses: [200] },
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },

    // Navigation (HTML Pages)
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" && !url.pathname.startsWith("/_vercel/"),
      handler: "NetworkFirst",
      options: {
        cacheName: PAGE_CACHE,
        networkTimeoutSeconds: 3,
        cacheableResponse: { statuses: [200] },
      },
    },
  ],
});

// Fallback to offline.html if page request fails offline
serwist.setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
  return Response.error();
});

serwist.addEventListeners();

// Safe pre-caching during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then(async (cache) => {
      try {
        await cache.add(OFFLINE_URL);
      } catch (err) {
        console.warn("Could not cache offline page:", err);
      }

      await Promise.allSettled(
        NAVBAR_ROUTES.map(async (route) => {
          try {
            const res = await fetch(route);
            if (res.ok) await cache.put(route, res);
          } catch (e) {
            // Ignore route fetch failures
          }
        })
      );
    })
  );
});

// Clear old cache versions on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (name) =>
              /^(pages-cache|asset-cache|markdown-cache)-/.test(name) &&
              !ACTIVE_CACHE_NAMES.has(name)
          )
          .map((name) => caches.delete(name))
      )
    )
  );
});