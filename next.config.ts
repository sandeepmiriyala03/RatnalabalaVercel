import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "path";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/", revision: "v1" },
    { url: "/offline.html", revision: "v1" },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ FIX for Next.js 16 + Vercel + Serwist
  outputFileTracingRoot: path.join(__dirname),
};

export default withSerwist(nextConfig);
