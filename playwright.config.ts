// playwright.config.ts — place at PROJECT ROOT
import { defineConfig, devices } from "@playwright/test";

const isTestingProd = !!process.env.TEST_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 1,
  reporter: "html",

  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Only spin up a local dev server when NOT testing production —
  // no point starting `npm run dev` if we're hitting the live site.
  webServer: isTestingProd
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60000,
      },
});