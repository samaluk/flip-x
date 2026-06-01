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
          name: "engine",
          environment: "node",
          include: ["tests/unit/engine/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "infrastructure",
          environment: "node",
          include: [
            "tests/unit/infrastructure/**/*.test.ts",
            "tests/unit/shared/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "contract",
          environment: "node",
          include: ["tests/contract/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["game/**/*.test.tsx", "tests/integration/**/*.test.tsx"],
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
          exclude: ["**/*.test.ts", "**/*.test.tsx"],
          setupFiles: ["./tests/browser-setup.ts"],
          css: true,
          testTimeout: 60_000,
        },
      },
    ],
  },
});
