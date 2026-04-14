import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LobbyCodeDisplay } from "./lobby-code-display";
import { withIntlEn } from "@/tests/test-intl";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LobbyCodeDisplay", () => {
  it("shows the lobby code", () => {
    render(withIntlEn(<LobbyCodeDisplay code="ABCD" />));

    expect(screen.getByText("ABCD")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("copies the code and shows copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav = window.navigator;
    const original = Object.getOwnPropertyDescriptor(nav, "clipboard");
    Object.defineProperty(nav, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    try {
      render(withIntlEn(<LobbyCodeDisplay code="PLAY" />));

      fireEvent.click(screen.getByRole("button", { name: /copy/i }));

      expect(writeText).toHaveBeenCalledWith("PLAY");
      expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
    } finally {
      if (original) {
        Object.defineProperty(nav, "clipboard", original);
      } else {
        Reflect.deleteProperty(nav, "clipboard");
      }
    }
  });
});
