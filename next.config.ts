import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPostHogConfig } from "@posthog/nextjs-config";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "flip7.localhost", "*.flip7.localhost"],
};

const posthogSourceMapsEnabled = Boolean(
  process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID,
);

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./shared/i18n/request.ts",
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

export default withPostHogConfig(withNextIntl(nextConfig), {
  personalApiKey: process.env.POSTHOG_API_KEY ?? "",
  projectId: process.env.POSTHOG_PROJECT_ID,
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  sourcemaps: {
    enabled: posthogSourceMapsEnabled,
    releaseName: "flip7",
    deleteAfterUpload: true,
  },
});
