import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ConnectivityLoadingShell, OfflineBanner } from "@/shared/connectivity/offline-feedback";
import { withIntlEn } from "@/tests/test-intl";

const { useOffline } = vi.hoisted(() => ({
  useOffline: vi.fn(() => false),
}));

vi.mock("next/offline", () => ({
  useOffline,
}));

describe("OfflineBanner", () => {
  beforeEach(() => {
    useOffline.mockReturnValue(false);
  });

  it("renders nothing when online", () => {
    const { container } = render(withIntlEn(<OfflineBanner />));

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the offline banner copy when offline", () => {
    useOffline.mockReturnValue(true);

    render(withIntlEn(<OfflineBanner />));

    expect(
      screen.getByText("You're offline. Pending requests will retry when you're back online."),
    ).toBeInTheDocument();
  });
});

describe("ConnectivityLoadingShell", () => {
  beforeEach(() => {
    useOffline.mockReturnValue(false);
  });

  it("renders children without connectivity copy when online", () => {
    render(
      withIntlEn(
        <ConnectivityLoadingShell>
          <p>Loading shell</p>
        </ConnectivityLoadingShell>,
      ),
    );

    expect(screen.getByText("Loading shell")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for connection…")).not.toBeInTheDocument();
  });

  it("shows waiting-for-connection copy when offline", () => {
    useOffline.mockReturnValue(true);

    render(
      withIntlEn(
        <ConnectivityLoadingShell>
          <p>Loading shell</p>
        </ConnectivityLoadingShell>,
      ),
    );

    expect(screen.getByText("Waiting for connection…")).toBeInTheDocument();
    expect(screen.getByText("Loading shell")).toBeInTheDocument();
  });
});
