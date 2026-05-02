import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";

// E2E runs provision a dedicated Convex preview deployment before Playwright starts the
// Next.js dev server. When NEXT_PUBLIC_CONVEX_URL is injected for a test run, do not
// reuse an existing :3000 server that may be pointed at a different backend.

const convexUrlFromPreviewCmd = process.env.NEXT_PUBLIC_CONVEX_URL;
const useCiLoopback = !!process.env.CI;

const e2ePort = process.env.E2E_PORT ?? (convexUrlFromPreviewCmd ? "3001" : "3000");

function getPortlessPublicUrl(): string {
  try {
    const url = execSync("pnpm exec portless get flip7", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (url.length > 0) {
      return url;
    }
  } catch {
    // Proxy not installed, portless unavailable, etc.
  }
  return "https://flip7.localhost";
}

const loopbackUrl = `http://127.0.0.1:${e2ePort}`;
const e2eBaseUrl = useCiLoopback ? loopbackUrl : getPortlessPublicUrl();

const portlessCaPath = join(homedir(), ".portless", "ca.pem");

const convexWebServerEnv = convexUrlFromPreviewCmd
  ? {
      NEXT_PUBLIC_CONVEX_URL: convexUrlFromPreviewCmd,
      ...(process.env.NEXT_PUBLIC_CONVEX_SITE_URL && {
        NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
      }),
    }
  : {};

const webServerEnv = {
  ...convexWebServerEnv,
  ...(useCiLoopback || !existsSync(portlessCaPath) ? {} : { NODE_EXTRA_CA_CERTS: portlessCaPath }),
};

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
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: useCiLoopback
      ? `node scripts/stop-next-dev.mjs && pnpm dev:app --port ${e2ePort}`
      : `node scripts/stop-next-dev.mjs && pnpm dev`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI && !convexUrlFromPreviewCmd,
    timeout: 120_000,
    env: Object.keys(webServerEnv).length > 0 ? webServerEnv : undefined,
  },
});
