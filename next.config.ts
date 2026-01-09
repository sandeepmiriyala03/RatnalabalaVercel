import withPWA from "next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 🔥 VERY IMPORTANT FOR VERCEL
  output: "standalone",
};

export default withPWA({
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
})(nextConfig);
