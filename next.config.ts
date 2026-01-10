import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", 
};

const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  // ONLY disable in development. DO NOT disable on Vercel.
  disable: process.env.NODE_ENV === "development", 
});

export default withPWA(nextConfig);

