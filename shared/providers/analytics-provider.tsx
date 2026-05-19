import { PostHogPageView, PostHogProvider } from "@posthog/next";
import type { ReactNode } from "react";

export async function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider clientOptions={{ api_host: "/ingest" }}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
}
