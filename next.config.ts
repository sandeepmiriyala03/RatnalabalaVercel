import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withEve } from "eve/next";

const isDev = process.env.NODE_ENV === "development";

const precacheRevision =
  process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

const SECURITY_HEADERS = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self)",
  },
];

const withSerwist = withSerwistInit({
  // Disable Serwist in development
  disable: isDev,

  swSrc: "sw.ts",
  swDest: "public/sw.js",

  additionalPrecacheEntries: isDev
    ? []
    : [
        {
          url: "/",
          revision: precacheRevision,
        },
        {
          url: "/offline.html",
          revision: precacheRevision,
        },
      ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  transpilePackages: ["@yuktishaalaa/yuktai"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },

      {
        source: "/wasm/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },

      {
        source: "/((?!wasm/).*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

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
        destination:
          "/api/main?__fn=reading_recommendations",
      },
      {
        source: "/api/sametalu_agent",
        destination:
          "/api/main?__fn=sametalu_agent",
      },
    ];
  },

  experimental: {
    useOffline: true,
  },

  turbopack: {},
};

// Serwist wrapper
const config = withSerwist(nextConfig);

// Eve only during development
export default isDev ? withEve(config) : config;