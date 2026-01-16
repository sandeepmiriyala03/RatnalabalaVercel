import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "sw-custom.ts",
  swDest: "public/sw.js",

  // 🔴 Disable Serwist in dev (Turbopack runs in dev only)
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ❌ DO NOT add turbopack or experimental.turbo
  // Webpack will be used automatically in production
};

export default withSerwist(nextConfig);
