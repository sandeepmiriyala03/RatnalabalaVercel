// next.config.ts
const withPWA = require("next-pwa")({
  dest: "public",
   swSrc: "public/sw-custom.js", // 👈 THIS IS THE KEY
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest.json$/],
  disable: process.env.NODE_ENV === "development",

  runtimeCaching: [
    // 🧠 Pages / App shell (navigation)
    {
      urlPattern: /^\/$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
        },
      },
    },

    // 🎨 Static assets (JS, CSS, images)
    {
      urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 100,
        },
      },
    },

    // 🔤 Fonts (Telugu fonts)
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "font-cache",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },

    // 🌐 API / JSON
    {
      urlPattern: /\/api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
