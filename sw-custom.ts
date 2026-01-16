/// <reference lib="webworker" />

import { Serwist, CacheFirst } from "serwist";
import type { PrecacheEntry } from "serwist";

/**
 * 🔴 REQUIRED BY @serwist/next
 * MUST exist as runtime reference
 */
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// 👇 required for Serwist build
const __IGNORE_MANIFEST__ = self.__SW_MANIFEST;

// ---- Cache names ----
const CACHE_VERSION = "v12";
const PAGE_CACHE = `pages-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const MARKDOWN_CACHE = `markdown-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// ---- Core pages (YOUR ROUTES) ----
const CORE_PAGES = [
  "/",            // మిరా
  "/poems",       // పద్యాలవాల
  "/mirapoems",   // మిరా పద్యాలు
  "/shatakamu",   // శతకాలమాల
  "/chitramala",  // చిత్రమాల
];

// ---- Minimal precache ----
const SAFE_PRECACHE: (PrecacheEntry | string)[] = [
  "/",
  OFFLINE_URL,
];

// ---- Serwist setup ----
const serwist = new Serwist({
  precacheEntries: SAFE_PRECACHE,
  skipWaiting: true,
  clientsClaim: true,

  runtimeCaching: [
    // Static assets
    {
      matcher: ({ request }) =>
        ["style", "script", "image", "font"].includes(
          request.destination
        ),
      handler: new CacheFirst({
        cacheName: ASSET_CACHE,
      }),
    },

    // Markdown poems
    {
      matcher: ({ url }) => url.pathname.endsWith(".md"),
      handler: new CacheFirst({
        cacheName: MARKDOWN_CACHE,
      }),
    },
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        url.pathname === "/api/shatakamu",

      handler: new CacheFirst({
        cacheName: "api-shatakamu-cache",
      }),
    },
  ],
});

serwist.addEventListeners();

/**
 * 🔥 INSTALL: silently cache all core pages
 * (user click అవసరం లేదు)
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);

      await Promise.all(
        CORE_PAGES.map(async (path) => {
          try {
            const res = await fetch(path, { cache: "no-store" });
            if (res.ok) {
              await cache.put(path, res.clone());
            }
          } catch {
            // ignore if offline during install
          }
        })
      );
    })()
  );
});

/**
 * 🔁 FETCH: automatic offline navigation
 */
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);

      try {
        // ONLINE → fetch & cache silently
        const networkResponse = await fetch(event.request);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch {
        // OFFLINE → cached page
        const cached = await cache.match(event.request);
        if (cached) return cached;

        // fallback
        return (
          (await cache.match(OFFLINE_URL)) ??
          new Response("<h1>Offline</h1>", {
            headers: { "Content-Type": "text/html" },
          })
        );
      }
    })()
  );
});
