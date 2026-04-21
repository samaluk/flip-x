import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: [
            "tests/**/*.test.ts",
            "tests/**/*.test.tsx",
            "game/**/*.test.ts",
            "game/**/*.test.tsx",
          ],
          exclude: ["tests/backend/**/*.test.ts", "tests/confect/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "confect",
          environment: "node",
          include: ["tests/confect/**/*.test.ts"],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                timeout: 60_000,
              },
            }),
            instances: [
              {
                browser: "chromium",
                // Tall enough for full-page element screenshots (Playwright composites only the
                // visible viewport; 720px was truncating tall VRT targets with a white tail).
                viewport: { width: 1440, height: 2400 },
              },
            ],
            screenshotFailures: false,
            expect: {
              toMatchScreenshot: {
                comparatorName: "pixelmatch",
                comparatorOptions: {
                  threshold: 0.2,
                  allowedMismatchedPixelRatio: 0.02,
                },
                // Single baseline per assertion (no OS/browser suffix). Baselines are produced
                // only via `pnpm test:vrt:update` in Linux Docker (Chromium) — see scripts/vrt-docker.sh.
                resolveScreenshotPath: ({ root, testFileDirectory, testFileName, arg, ext }) =>
                  path.join(
                    root,
                    testFileDirectory,
                    "__screenshots__",
                    testFileName,
                    `${arg}${ext}`,
                  ),
              },
            },
          },
          include: ["tests/**/*.vitest.tsx", "game/**/*.vitest.tsx"],
          setupFiles: ["./tests/browser-setup.ts"],
          css: true,
          testTimeout: 60_000,
        },
      },
    ],
  },
});
