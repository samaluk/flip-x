import { describe, expect, it } from "vitest";

import { buildRoundCompletionOutcome } from "@/game/application/round-completion";
import type { PlayerRoundState, RoundRuntime } from "@/game/logic/round-state";

function baseRound(): RoundRuntime {
  return {
    phase: "scoring",
    roundNumber: 1,
    dealerSeat: 0,
    drawPile: [],
    discardPile: [],
    openingSeatIndex: 0,
    turnSeatIndex: 0,
    activePlayerId: null,
    endedBy: "all_inactive",
    pendingAction: null,
    pendingFlip3: null,
  };
}

function playerState(playerId: string, roundScore: number): PlayerRoundState {
  return {
    playerId,
    status: "stayed",
    numberCards: [
      {
        cardId: `${playerId}-score`,
        cardType: "number",
        numberValue: roundScore,
      },
    ],
    modifierCards: [],
    heldActionCards: [],
    receivedActionCards: [],
    roundScore: 0,
    pointsAtRisk: roundScore,
    hasFlip7: false,
    bustCard: null,
  };
}

describe("buildRoundCompletionOutcome", () => {
  it("carries round scores forward and selects the unique highest player at target", () => {
    const outcome = buildRoundCompletionOutcome({
      round: baseRound(),
      match: { targetScore: 200 } as never,
      players: [
        { _id: "p1", totalScore: 190 },
        { _id: "p2", totalScore: 180 },
      ] as never,
      playerStates: {
        p1: playerState("p1", 15),
        p2: playerState("p2", 10),
      },
      matchUpdateContext: {},
    });

    expect(outcome.matchCompleted).toBe(true);
    expect(outcome.matchPatch).toEqual({
      status: "completed",
      winnerPlayerId: "p1",
    });
    expect(outcome.playerScorePatches).toEqual({
      p1: { totalScore: 205, hasWon: true },
      p2: { totalScore: 190, hasWon: false },
    });
    expect(outcome.scoreBreakdowns.p1?.finalRoundScore).toBe(15);
    expect(outcome.scoreBreakdowns.p2?.finalRoundScore).toBe(10);
  });

  it("keeps the match in progress when the target score has a high-score tie", () => {
    const outcome = buildRoundCompletionOutcome({
      round: baseRound(),
      match: { targetScore: 200 } as never,
      players: [
        { _id: "p1", totalScore: 190 },
        { _id: "p2", totalScore: 180 },
      ] as never,
      playerStates: {
        p1: playerState("p1", 10),
        p2: playerState("p2", 20),
      },
      matchUpdateContext: {},
    });

    expect(outcome.matchCompleted).toBe(false);
    expect(outcome.matchPatch).toEqual({});
    expect(outcome.playerScorePatches).toEqual({
      p1: { totalScore: 200, hasWon: false },
      p2: { totalScore: 200, hasWon: false },
    });
  });
});
