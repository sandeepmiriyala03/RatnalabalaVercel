import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

 
  turbopack: {},
};

const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
