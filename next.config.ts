// next.config.js
const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require("next/constants");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add any other Next.js options you need (e.g. images, env, etc.)
};

// Only enable PWA in development and local production builds
// Disable on Vercel to avoid service worker issues in preview/prod
const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.VERCEL === "1", // Disable PWA on Vercel
});

// Export config with PWA only in dev and local build
module.exports = (phase) => {
  if (
    phase === PHASE_DEVELOPMENT_SERVER ||
    phase === PHASE_PRODUCTION_BUILD
  ) {
    return withPWA(nextConfig);
  }
  return nextConfig;
};
