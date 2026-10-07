import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withEve } from "eve/next";
import { randomUUID } from "node:crypto";

const isDev = process.env.NODE_ENV === "development";

/* New revision on every deploy so the offline cache refreshes.
   Off Vercel (local `next build`), a random id instead of a fixed
   "dev", which would never invalidate. */
const precacheRevision = process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID();

/* ═══════════════════════════════════════════
   HEADERS
═══════════════════════════════════════════ */

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* Stops other sites from showing this site inside a hidden frame
     (clickjacking). Safe on its own: it doesn't restrict scripts,
     styles or fonts, so nothing on the site breaks. */
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // older browsers
  /* Camera + mic only for this site (speech features); everything
     else the site never uses is switched off. */
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

/* Needed for SharedArrayBuffer / multi-threaded WASM.
   Note: COOP "same-origin" breaks sign-in popups from other sites,
   and COEP blocks third-party iframes (YouTube, Google Forms embeds)
   that don't opt in. If only some pages run WASM, list just those
   routes here instead of the whole site. */
const ISOLATION_HEADERS = [
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const ONE_YEAR = 60 * 60 * 24 * 365;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/* ═══════════════════════════════════════════
   API SHORTCUTS → /api/main
   Same list as before, written once.
═══════════════════════════════════════════ */

const API_FN_ROUTES = [
  "aksharamala",
  "gita",
  "rag_chat",
  "reading_recommendations",
  "sametalu_agent",
] as const;

/* ═══════════════════════════════════════════
   SERWIST (service worker / offline)

   ⚠ Next.js 16 builds with Turbopack by default, and this
   withSerwist wrapper only works with webpack. Build with
   `next build --webpack`, or move to Serwist's configurator
   mode (works with Turbopack).
═══════════════════════════════════════════ */

const withSerwist = withSerwistInit({
  disable: isDev,

  swSrc: "sw.ts",
  swDest: "public/sw.js",

  /* Don't auto-reload when the connection comes back: a reader
     could lose a half-typed question, and Next.js (useOffline below)
     already retries pending requests on its own. */
  reloadOnOnline: false,

  additionalPrecacheEntries: isDev
    ? []
    : [
        { url: "/", revision: precacheRevision },
        { url: "/offline.html", revision: precacheRevision },
      ],
});

/* ═══════════════════════════════════════════
   NEXT CONFIG
═══════════════════════════════════════════ */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"

  /* Next.js 16.4: Cache Components + Partial Prefetching.
     • Pages are prerendered as a static shell, so tapping a menu shows the page at once
     • Going to another menu and back keeps the page's state (<Activity hidden>):
       a PDF Q&A, a half-made poster, a story stay where they were
     • Nothing is cached unless marked "use cache"; segment configs like
       dynamic / revalidate / fetchCache / dynamicParams / runtime="edge" fail the build
     • No Math.random() / Date.now() / new Date() during render (only in effects / handlers)
     • A "use client" page cannot export ensureStatic; put it in a server page.tsx
     • Check that the build still passes with `next build --webpack` (Serwist) */
  cacheComponents: true,
  partialPrefetching: true, // set it explicitly; leaving it out logs a warning

  transpilePackages: ["@yuktishaalaa/yuktai"],

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },

      { source: "/((?!wasm/).*)", headers: ISOLATION_HEADERS },

      {
        source: "/wasm/:path*",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cache-Control", value: `public, max-age=${THIRTY_DAYS}, stale-while-revalidate=${THIRTY_DAYS}` },
        ],
      },

      /* Service worker must never be cached, or updates get stuck
         on readers' phones until the browser decides to re-check */
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },

      /* Manifest: short cache so icon/name changes show up */
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },

      /* Telugu fonts are large and almost never change: cache them
         so pages open fast on slow mobile data. If you replace a
         font file, give it a new file name. */
      {
        source: "/Fonts/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${ONE_YEAR}, immutable` }],
      },

      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${THIRTY_DAYS}` }],
      },
    ];
  },

  async rewrites() {
    return [
      // These use ?endpoint= (the others use ?__fn=)
      { source: "/api/extract-news", destination: "/api/main?endpoint=extract-news" },
      // WebMCP search (retrieval only, no AI answer). ?query= is passed through.
      { source: "/api/search", destination: "/api/main?endpoint=bhavalamala-search" },

      ...API_FN_ROUTES.map((fn) => ({
        source: `/api/${fn}`,
        destination: `/api/main?__fn=${fn}`,
      })),
    ];
  },

  experimental: {
    /* Next.js 16.3+: when the network drops, navigations, prefetches
       and Server Actions wait and retry once the connection returns
       instead of failing. Also enables useOffline() from "next/offline".
       Experimental: Next.js doesn't yet recommend it for production. */
    useOffline: true,
  },

  turbopack: {},
};

// Serwist wrapper
const config = withSerwist(nextConfig);

// Eve only during development
export default isDev ? withEve(config) : config;