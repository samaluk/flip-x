import { defineConfig, devices } from "@playwright/test";

// E2E runs provision a dedicated Convex preview deployment before Playwright starts the
// Next.js dev server. When NEXT_PUBLIC_CONVEX_URL is injected for a test run, do not
// reuse an existing :3000 server that may be pointed at a different backend.

const convexUrlFromPreviewCmd = process.env.NEXT_PUBLIC_CONVEX_URL;

export default defineConfig({
  testDir: "./e2e",
  // Helpers can legitimately spend close to 90s waiting for game state changes,
  // so the overall test budget needs to stay comfortably above that.
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
