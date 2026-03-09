import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for responsive screenshot testing.
 *
 * Captures screenshots of the site at multiple viewport sizes.
 * Screenshots are saved to client/screenshots/ for visual review.
 *
 * Usage:
 *   cd client && npx playwright test
 *
 * Prerequisites:
 *   npx playwright install chromium
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./screenshots",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "off", // We take screenshots manually in tests
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    {
      name: "mobile-portrait",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-landscape",
      use: {
        viewport: { width: 844, height: 390 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      use: {
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop-small",
      use: {
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: "desktop-large",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
