import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TurnControls } from "@/game/ui/turn-controls";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { withIntlEn } from "@/tests/test-intl";

function snapshot(): MatchSnapshot {
  return {
    matchId: "match-1",
    status: "in_progress",
    targetScore: 200,
    currentRoundNumber: 1,
    dealerSeat: 0,
    viewerPlayerId: "p1",
    activePlayerId: "p1",
    pendingAction: null,
    roundStatus: "player_turns",
    endedBy: "unknown",
    latestEvent: null,
    players: [
      {
        playerId: "p1",
        displayName: "Alex",
        seatIndex: 0,
        totalScore: 12,
        isOnline: true,
        roundStatus: "active",
        pointsAtRisk: 12,
        numberCards: [],
        modifierCards: [],
        heldActionCards: [],
        scoreBreakdown: {
          additiveModifierTotal: 0,
          finalRoundScore: 12,
          flip7Bonus: 0,
          multipliedTotal: 12,
          multiplierApplied: false,
          numberCardTotal: 12,
        },
      },
    ],
  };
}

describe("round flow UI", () => {
  it("shows hit and stay controls for the active player", () => {
    render(
      withIntlEn(
        <TurnControls
          snapshot={snapshot()}
          onHit={vi.fn()}
          onStay={vi.fn()}
          onResolveAction={vi.fn()}
          onStartNextRound={vi.fn()}
        />,
      ),
    );

    expect(screen.getByRole("button", { name: /hit for alex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stay for alex/i })).toBeInTheDocument();
  });

  it("disables turn controls when this device does not own the active seat", () => {
    render(
      withIntlEn(
        <TurnControls
          snapshot={{ ...snapshot(), viewerPlayerId: "p2" }}
          onHit={vi.fn()}
          onStay={vi.fn()}
          onResolveAction={vi.fn()}
          onStartNextRound={vi.fn()}
        />,
      ),
    );

    expect(screen.getByRole("button", { name: /hit for alex/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /stay for alex/i })).toBeDisabled();
    expect(screen.getByText(/waiting for alex/i)).toBeInTheDocument();
  });
});
