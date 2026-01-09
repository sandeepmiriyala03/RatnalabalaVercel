import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,

  // 🔥 CRITICAL FIX
  disable: process.env.VERCEL === "1",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
