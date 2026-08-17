import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { GameErrorContent } from "./game-error-content";
import { withIntlEn } from "@/tests/test-intl";

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@posthog/next", () => ({
  usePostHog: () => ({
    captureException,
  }),
}));

describe("GameErrorContent", () => {
  const originalPostHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    captureException.mockClear();
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-posthog-key";
  });

  afterEach(() => {
    if (originalPostHogKey === undefined) {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      return;
    }

    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalPostHogKey;
  });

  it("renders the error title, message, and try-again control", () => {
    const error = new Error("Match fetch failed");

    render(
      withIntlEn(
        <GameErrorContent error={error} retry={vi.fn()} locale="en" matchId="match-123" />,
      ),
    );

    expect(screen.getByRole("heading", { name: /could not load the match/i })).toBeInTheDocument();
    expect(screen.getByText("Match fetch failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls retry when try again is clicked", () => {
    const retry = vi.fn();
    const error = new Error("Transient failure");

    render(
      withIntlEn(<GameErrorContent error={error} retry={retry} locale="en" matchId="match-123" />),
    );

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("captures the exception in PostHog when the key is set", async () => {
    const error = new Error("Server render failed");

    render(
      withIntlEn(
        <GameErrorContent error={error} retry={vi.fn()} locale="en" matchId="match-456" />,
      ),
    );

    await waitFor(() => {
      expect(captureException).toHaveBeenCalledWith(error, {
        locale: "en",
        matchId: "match-456",
        route: "/[locale]/game/[matchId]",
      });
    });
  });

  it("does not capture the exception when PostHog is not configured", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "";
    const error = new Error("Server render failed");

    render(
      withIntlEn(
        <GameErrorContent error={error} retry={vi.fn()} locale="en" matchId="match-456" />,
      ),
    );

    await waitFor(() => {
      expect(captureException).not.toHaveBeenCalled();
    });
  });
});
