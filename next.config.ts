// next.config.ts
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // development లో disable
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // basePath, images, redirects etc. config here if needed
};

module.exports = withPWA(nextConfig);
