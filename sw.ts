/// <reference lib="webworker" />

import { Serwist, CacheFirst, NetworkFirst, NetworkOnly } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[] | undefined;
};

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
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/_vercel/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        ["style", "script", "image", "font"].includes(request.destination) &&
        !url.pathname.startsWith("/_vercel/"),
      handler: new CacheFirst({
        cacheName: ASSET_CACHE,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response && response.status === 200 ? response : null,
          },
        ],
      }),
    },
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: new CacheFirst({
        cacheName: MARKDOWN_CACHE,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response && response.status === 200 ? response : null,
          },
        ],
      }),
    },
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" && !url.pathname.startsWith("/_vercel/"),
      handler: new NetworkFirst({
        cacheName: PAGE_CACHE,
        networkTimeoutSeconds: 3,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response && response.status === 200 ? response : null,
          },
        ],
      }),
    },
  ],
});

serwist.setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
  return Response.error();
});

serwist.addEventListeners();

self.addEventListener("install", (event: ExtendableEvent) => {
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

self.addEventListener("activate", (event: ExtendableEvent) => {
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