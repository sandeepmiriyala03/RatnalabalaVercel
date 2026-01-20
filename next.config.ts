import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",        // ✅ SOURCE FILE
  swDest: "public/sw.js",    // ✅ FINAL OUTPUT
  additionalPrecacheEntries: [
    { url: "/", revision: "v1" },
    { url: "/offline.html", revision: "v1" },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
