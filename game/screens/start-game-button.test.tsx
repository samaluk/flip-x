import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartGameButton } from "@/game/screens/start-game-button";
import { withIntlEn } from "@/tests/test-intl";

const startMatch = vi.fn();

vi.mock("@/shared/lib/confect-hooks", () => ({
  useSessionConfectMutation: () => startMatch,
}));

describe("StartGameButton", () => {
  beforeEach(() => {
    startMatch.mockReset();
    startMatch.mockResolvedValue(null);
  });

  it("shows a pending label while the start action runs", async () => {
    let resolveStart: (value: unknown) => void = () => {};
    const pendingStart = new Promise((resolve) => {
      resolveStart = resolve;
    });
    startMatch.mockReturnValue(pendingStart);

    render(withIntlEn(<StartGameButton matchId="match-1" version={3} isHost playerCount={2} />));

    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    expect(screen.getByRole("button", { name: /starting/i })).toBeDisabled();

    resolveStart(null);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start game/i })).toBeEnabled();
    });
  });
});
