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
    pendingFlip3: null,
    roundStatus: "player_turns",
    endedBy: "unknown",
    latestEvent: null,
    roundHistory: [],
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
        bustCard: null,
        modifierCards: [],
        heldActionCards: [],
        receivedActionCards: [],
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

function renderTurnControls(match: MatchSnapshot) {
  return render(
    withIntlEn(
      <TurnControls
        snapshot={match}
        onHit={vi.fn()}
        onStay={vi.fn()}
        onResolveAction={vi.fn()}
        onStartNextRound={vi.fn()}
      />,
    ),
  );
}

describe("round flow UI", () => {
  it("shows hit and stay controls for the active player", () => {
    renderTurnControls(snapshot());

    expect(screen.getByRole("button", { name: /hit for alex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stay for alex/i })).toBeInTheDocument();
  });

  it("disables turn controls when this device does not own the active seat", () => {
    renderTurnControls({ ...snapshot(), viewerPlayerId: "p2" });

    expect(screen.getByRole("button", { name: /hit for alex/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /stay for alex/i })).toBeDisabled();
    expect(screen.getByText(/waiting for alex/i)).toBeInTheDocument();
  });

  it("keeps stay disabled while the active player is resolving Flip Three", () => {
    renderTurnControls({
      ...snapshot(),
      pendingFlip3: {
        sourcePlayerId: "p2",
        targetPlayerId: "p1",
        cardsRemaining: 2,
        deferredActionCards: [],
      },
    });

    expect(screen.getByRole("button", { name: /draw \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stay for alex/i })).toBeDisabled();
  });
});
