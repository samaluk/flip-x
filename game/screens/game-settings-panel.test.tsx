import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameSettingsPanel } from "@/game/screens/game-settings-panel";
import { buildTestMatchSnapshot } from "@/tests/builders/match-snapshot";
import { withIntlEn } from "@/tests/test-intl";

const updateMatchSettings = vi.fn();

vi.mock("@/shared/lib/confect-hooks", () => ({
  useSessionConfectMutation: () => updateMatchSettings,
}));

function setupSnapshot(isHost: boolean) {
  return buildTestMatchSnapshot({
    status: "setup",
    version: 7,
    hostPlayerId: "p1",
    viewerPlayerId: isHost ? "p1" : "p2",
    players: [
      { playerId: "p1", displayName: "Host", seatIndex: 0, totalScore: 0, isOnline: true },
      { playerId: "p2", displayName: "Guest", seatIndex: 1, totalScore: 0, isOnline: true },
    ],
  });
}

describe("GameSettingsPanel", () => {
  beforeEach(() => {
    updateMatchSettings.mockReset();
    updateMatchSettings.mockResolvedValue(null);
  });

  it("renders read-only settings for non-host players", () => {
    render(withIntlEn(<GameSettingsPanel snapshot={setupSnapshot(false)} />));

    expect(screen.getByText("Game settings")).toBeInTheDocument();
    expect(screen.getByText("Points to win")).toBeInTheDocument();
    expect(screen.getByText("0-12")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /classic/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/save settings/i)).not.toBeInTheDocument();
  });

  it("lets the host apply a preset immediately", async () => {
    render(withIntlEn(<GameSettingsPanel snapshot={setupSnapshot(true)} />));

    fireEvent.click(screen.getByRole("button", { name: /extended/i }));

    expect(updateMatchSettings).toHaveBeenCalledWith({
      matchId: "match-1",
      expectedVersion: 7,
      patch: {
        targetScore: 250,
        maxNumberCardValue: 14,
      },
    });
    expect(screen.queryByText(/save settings/i)).not.toBeInTheDocument();
  });
});
