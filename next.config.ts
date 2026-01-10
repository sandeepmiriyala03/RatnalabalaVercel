// next.config.ts
import type { NextConfig } from "next";

const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require("next/constants");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add any other options (images, env, etc.) here
};

// Only enable PWA in dev and local build, disable on Vercel
const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.VERCEL === "1", // Disable PWA on Vercel
});

// Export config with PWA only in dev and local build
module.exports = (phase: string) => {
  if (
    phase === PHASE_DEVELOPMENT_SERVER ||
    phase === PHASE_PRODUCTION_BUILD
  ) {
    return withPWA(nextConfig);
  }
  return nextConfig;
};
