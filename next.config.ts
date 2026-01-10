import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const withPWA = withPWAInit({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  ouptut: "standalone",
  // Ensure this is truly disabled during Vercel builds to prevent lock issues
  disable: process.env.NODE_ENV === "development" || process.env.VERCEL === "1",
});

export default withPWA(nextConfig);