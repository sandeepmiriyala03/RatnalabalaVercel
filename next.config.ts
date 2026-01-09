import type { NextConfig } from "next";

// 🔥 next-pwa has no types → require() is correct
// eslint-disable-next-line @typescript-eslint/no-var-requires
/// addddsdf
const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  excludeChunks: [
    "middleware-manifest.json",
    "app-build-manifest.json",
    "_buildManifest.js",
    "middleware.js",
    "pages-manifest.json",
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 🔥 REQUIRED for Vercel + PWA
  output: "standalone",
};

module.exports = withPWA(nextConfig);


