import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "@/shared/providers/analytics-provider";

const { mockPostHogPageView, mockPostHogProvider } = vi.hoisted(() => ({
  mockPostHogPageView: vi.fn(),
  mockPostHogProvider: vi.fn(),
}));

vi.mock("@posthog/next", () => ({
  PostHogPageView: (props: Record<string, unknown>) => {
    mockPostHogPageView(props);
    return <div data-testid="mock-posthog-pageview" />;
  },
  PostHogProvider: (props: { clientOptions?: unknown; children: ReactNode }) => {
    mockPostHogProvider(props);
    return <div data-testid="mock-posthog-provider">{props.children}</div>;
  },
}));

describe("AnalyticsProvider", () => {
  const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    } else {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey;
    }
  });

  it("renders children directly without PostHog providers when NEXT_PUBLIC_POSTHOG_KEY is not set", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    const element = await AnalyticsProvider({
      children: <span>Child Without Analytics</span>,
    });
    render(element);

    expect(screen.getByText("Child Without Analytics")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-posthog-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-posthog-pageview")).not.toBeInTheDocument();
    expect(mockPostHogProvider).not.toHaveBeenCalled();
    expect(mockPostHogPageView).not.toHaveBeenCalled();
  });

  it("renders PostHogProvider with captureRouteTemplate enabled on PostHogPageView when NEXT_PUBLIC_POSTHOG_KEY is set", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key_123";

    const element = await AnalyticsProvider({
      children: <span>Child With Analytics</span>,
    });
    render(element);

    expect(screen.getByText("Child With Analytics")).toBeInTheDocument();
    expect(screen.getByTestId("mock-posthog-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-posthog-pageview")).toBeInTheDocument();

    expect(mockPostHogProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        clientOptions: {
          api_host: "/ingest",
          capture_exceptions: true,
        },
      }),
    );

    expect(mockPostHogPageView).toHaveBeenCalledWith({
      captureRouteTemplate: true,
    });
  });
});
