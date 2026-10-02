import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withEve } from "eve/next";

const isDev = process.env.NODE_ENV === "development";

// Changes on every deploy, so the service worker re-caches "/" and the
// offline page instead of serving an old homepage (and old JS chunks) forever.
const precacheRevision = process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString();

const withSerwist = withSerwistInit({
  // No service worker in development (avoids HMR / Turbopack conflicts)
  disable: isDev,

  // Source in the project root (NOT inside /public)
  swSrc: "sw.ts",
  swDest: "public/sw.js",

  // Pages that aren't build files get a fresh revision each deploy
  additionalPrecacheEntries: [
    { url: "/", revision: precacheRevision },
    { url: "/offline.html", revision: precacheRevision },
  ],
});

// Safe on every response; they don't change how any page works
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Mic (family voice recorder, pronunciation practice) and camera only for
  // this site itself — embedded third-party frames can't ask for them
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self)" },
];

const nextConfig: NextConfig = {
  // `output: "standalone"` removed: it's for Docker / self-hosting.
  // Vercel packages the app itself, so it only made builds slower.
  // Add it back only if you also self-host.

  reactStrictMode: true,

  // The real package name (the old "yuktai" / "yuktai-js" matched nothing)
  transpilePackages: ["@yuktishaalaa/yuktai"],

  async headers() {
    return [
      // Security headers — every route
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },

      // WASM files
      {
        source: "/wasm/:path*",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },

      // Cross-origin isolation for pages (needed for SharedArrayBuffer /
      // multi-threaded WASM). "credentialless" still allows analytics/fonts.
      // NOTE: blocks cross-origin iframes such as YouTube embeds. If nothing
      // uses SharedArrayBuffer (e.g. ffmpeg.wasm for video downloads), this
      // block can be removed.
      {
        source: "/((?!wasm/).*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  // Kept here (works in `next dev` too) — remove the same rule from vercel.json
async rewrites() {
  return [
    {
      source: "/api/extract-news",
      destination: "/api/main?endpoint=extract-news",
    },
    {
      source: "/api/aksharamala",
      destination: "/api/main?__fn=aksharamala",
    },
    {
      source: "/api/gita",
      destination: "/api/main?__fn=gita",
    },
    {
      source: "/api/rag_chat",
      destination: "/api/main?__fn=rag_chat",
    },
    {
      source: "/api/reading_recommendations",
      destination: "/api/main?__fn=reading_recommendations",
    },
    {
      source: "/api/sametalu_agent",
      destination: "/api/main?__fn=sametalu_agent",
    },
  ];
},



  experimental: {
    // Navigations, data fetches and Server Actions wait while offline and
    // retry when the connection returns (used by OfflineBanner)
    useOffline: true,
  },

  // Dev runs on Turbopack; production builds use webpack because of Serwist
  turbopack: {},
};

const config = withSerwist(nextConfig);

// Eve is a development tool ([eve:dev] server) — keep it out of production builds.
// If Eve turns out to be needed in production, export withEve(config) always.
export default isDev ? withEve(config) : config;