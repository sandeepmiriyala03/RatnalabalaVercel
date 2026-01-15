import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "public/sw-custom.js",
  swDest: "public/sw.js",
  // Precache home (app shell) and offline page
  additionalPrecacheEntries: [
    { url: "/" },
    { url: "/offline.html" },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withSerwist(nextConfig);
