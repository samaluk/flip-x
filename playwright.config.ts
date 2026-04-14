import { defineConfig, devices } from "@playwright/test";

// E2E with Convex: `scripts/convex-preview-e2e.sh` runs `npx convex dev --local`, sets
// NEXT_PUBLIC_CONVEX_URL (and optional NEXT_PUBLIC_CONVEX_SITE_URL), then runs Playwright.
// Run via `pnpm test:e2e:preview`. Optional overrides: CONVEX_LOCAL_URL, CONVEX_LOCAL_SITE_URL.
//
// When NEXT_PUBLIC_CONVEX_URL is set for E2E, do not reuse an existing dev server on :3000.

const convexUrlFromPreviewCmd = process.env.NEXT_PUBLIC_CONVEX_URL;

export default defineConfig({
  testDir: "./e2e",
  // Helpers poll up to 90s (e.g. hit button); default 60s would cut those off.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI && !convexUrlFromPreviewCmd,
    timeout: 120_000,
    env: convexUrlFromPreviewCmd
      ? {
          NEXT_PUBLIC_CONVEX_URL: convexUrlFromPreviewCmd,
          ...(process.env.NEXT_PUBLIC_CONVEX_SITE_URL && {
            NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
          }),
        }
      : undefined,
  },
});
