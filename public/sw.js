/* ======================================================
   📜 రత్నాలబాల – SERVICE WORKER (FINAL)
   Routes supported:
   /, /MIRIAQuiz, /AboutAuthor, /poems,
   /PoemTitles, /images, /Dedication
   Next.js App Router | PWA | Offline-First
   Audio → Network Only
   ===================================================== */

const CACHE_NAME = "ratnalabala-runtime-v1";
const OFFLINE_URL = "/offline.html";

/* ================= INSTALL ================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.add(OFFLINE_URL); // offline fallback page
      } catch (err) {
        console.error("Offline page cache failed", err);
      }
      self.skipWaiting();
    })()
  );
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

/* ================= FETCH ================= */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  /* 🔊 AUDIO FILES → ALWAYS NETWORK */
  if (req.destination === "audio" || req.url.endsWith(".mp3")) {
    event.respondWith(fetch(req));
    return;
  }

  /* 🧭 PAGE NAVIGATION (ALL ROUTES) */
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const preload = await event.preloadResponse;
          const response = preload || (await fetch(req));

          if (response && response.ok) {
            await cache.put(req, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(req);
          return cached || (await caches.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  /* ⚡ STATIC ASSETS → CACHE FIRST */
  if (
    req.url.includes("/_next/static/") ||
    req.url.includes("/Images/") ||
    req.url.includes("/images/") ||
    req.url.includes("/Fonts/") ||
    req.destination === "image" ||
    req.destination === "style" ||
    req.destination === "font"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  /* 🌐 EVERYTHING ELSE → NETWORK */
});

/* ================= HELPERS ================= */

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  if (cached) return cached;

  try {
    const network = await fetch(req);
    if (network && network.ok) {
      await cache.put(req, network.clone());
    }
    return network;
  } catch {
    return (
      (await caches.match(OFFLINE_URL)) ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}
