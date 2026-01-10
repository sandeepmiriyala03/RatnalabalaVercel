import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", 
};

// Use require here to bypass the missing ESM type declarations
const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development" || process.env.VERCEL === "1",
});

export default withPWA(nextConfig);
