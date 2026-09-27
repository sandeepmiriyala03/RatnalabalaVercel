import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withEve } from "eve/next";

const withSerwist = withSerwistInit({
  // Disable Service Worker in development to prevent HMR / Turbopack conflicts
  disable: process.env.NODE_ENV === "development",
  
  // Point swSrc to root directory (NOT inside /public)
  swSrc: "sw.ts",
  swDest: "public/sw.js",

  // Serwist auto-injects Revision hash for precache files
  additionalPrecacheEntries: [
    { url: "/", revision: "1" },
    { url: "/offline.html", revision: "1" },
  ],
});

const nextConfig: NextConfig = {
  // 1. Optimize bundle size for serverless deployment
  output: "standalone",

  reactStrictMode: true,

  // 2. Transpile local/custom packages
  transpilePackages: ["yuktai", "yuktai-js"],

  // 3. Selective Headers Configuration
  async headers() {
    return [
      // WASM Headers
      {
        source: "/wasm/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      // Global COOP/COEP Headers - using credentialless to allow analytics/fonts
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
    ];
  },

  turbopack: {},
};

export default withEve(withSerwist(nextConfig));