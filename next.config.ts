import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Disable Service Worker in development to avoid Turbopack HMR conflicts
  disable: process.env.NODE_ENV === "development",
  swSrc: "public/sw-custom.js",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/" },
    { url: "/offline.html" },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // 1. Transpile your custom packages
  transpilePackages: ["yuktai", "yuktai-js"], 

  // 2. WASM & Cross-Origin Isolation Headers
  async headers() {
    return [
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
        source: "/(.*)",
        headers: [
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
    ];
  },

  async rewrites() {
    return [
      { source: "/api/extract-news", destination: "/api/main?endpoint=extract-news" },
    ];
  },
  turbopack: {},
};

export default withSerwist(nextConfig);