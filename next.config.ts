import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "public/sw-custom.js",
  swDest: "public/sw.js",
  // Pre-cache your offline page
  additionalPrecacheEntries: [{ url: "/offline.html" }],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep turbopack enabled (default in Next.js 16)
  turbopack: {},
};

export default withSerwist(nextConfig);
