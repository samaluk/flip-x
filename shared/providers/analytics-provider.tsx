import { PostHogPageView, PostHogProvider } from "@posthog/next";
import type { ReactNode } from "react";

export async function AnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider clientOptions={{ api_host: "/ingest" }}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
}
