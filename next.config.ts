import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPostHogConfig } from "@posthog/nextjs-config";

const nextConfig: NextConfig = {
  // Instant Navigation: Cache Components + Partial Prefetching (#483).
  // https://nextjs.org/docs/app/guides/instant-navigation
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "flip-x.localhost", "*.flip-x.localhost"],
  experimental: {
    // Queue failed soft navigations, prefetches, and Server Actions until reconnect (#488).
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/useOffline
    useOffline: true,
    // The root layout lives under a top-level dynamic segment (`[locale]`), so
    // the app-level 404 needs `app/global-not-found.tsx` to render consistently.
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/experimental#globalnotfound
    globalNotFound: true,
    // TypeScript 7 has no JS compiler API; use the project-local tsc CLI.
    // https://nextjs.org/docs/app/api-reference/config/typescript#using-typescript-7
    useTypeScriptCli: true,
    // Use the native Rust React Compiler implementation in Turbopack.
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackRustReactCompiler
    turbopackRustReactCompiler: true,
  },
};

const posthogSourceMapsEnabled = Boolean(
  process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID,
);

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./shared/i18n/request.ts",
  experimental: {
    extract: true,
    messages: {
      path: "./messages",
      format: "po",
      locales: "infer",
      sourceLocale: "en",
    },
    srcPath: ["./app", "./shared", "./game"],
  },
});

export default withPostHogConfig(withNextIntl(nextConfig), {
  personalApiKey: process.env.POSTHOG_API_KEY ?? "",
  projectId: process.env.POSTHOG_PROJECT_ID,
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  sourcemaps: {
    enabled: posthogSourceMapsEnabled,
    releaseName: "flip-x",
    deleteAfterUpload: true,
  },
});
