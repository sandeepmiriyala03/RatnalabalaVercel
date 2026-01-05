const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});
