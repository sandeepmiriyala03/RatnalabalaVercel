const withPWA = require("next-pwa")({
  dest: "public",
  swSrc: "public/sw-custom.js",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  excludeChunks: [
    'middleware-manifest.json',
    'app-build-manifest.json',
    '_buildManifest.js',
    'middleware.js',
    'pages-manifest.json'
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
});
