import { defineConfig, devices } from "@playwright/test";

// Preview E2E: `scripts/convex-preview-e2e.sh` deploys functions first, then sets
// NEXT_PUBLIC_CONVEX_URL and runs Playwright (Convex's `deploy --cmd` runs the command *before*
// pushing functions to preview, which breaks backend-dependent e2e).
// Local: `CONVEX_DEPLOY_KEY=<preview key> pnpm test:e2e:preview` (optional `CONVEX_PREVIEW_NAME=...`).
//
// When NEXT_PUBLIC_CONVEX_URL is set for preview, do not reuse an existing dev server on :3000.

const convexUrlFromPreviewCmd = process.env.NEXT_PUBLIC_CONVEX_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
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
