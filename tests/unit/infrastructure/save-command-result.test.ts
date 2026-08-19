import { describe, expect, it } from "vitest";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { GameTransition } from "@/game/application/game-transition";
import { resolveMatchPatch } from "@/game/infrastructure/save-command-result";

const matchId = "match-1" as Id<"matches">;
const playerIds = new Map<string, Id<"players">>([
  ["p1", "p1-doc" as Id<"players">],
  ["p2", "p2-doc" as Id<"players">],
]);

function baseMatch(): Doc<"matches"> {
  return {
    _id: matchId,
    _creationTime: 1000,
    version: 3,
    status: "in_progress",
    targetScore: 200,
    currentRoundNumber: 1,
    dealerSeat: 0,
    lobbyCode: "TEST",
    updatedAt: 1000,
  } as Doc<"matches">;
}

function baseTransition(): GameTransition {
  return {
    command: "TAKE_TURN",
    roundWrite: {
      kind: "update",
      roundId: "round-1" as Id<"rounds">,
      round: {
        phase: "player_turns",
        roundNumber: 1,
        dealerSeat: 0,
        drawPile: [],
        discardPile: [],
        openingSeatIndex: 0,
        turnSeatIndex: 0,
        activePlayerId: "p1",
        endedBy: "unknown",
        pendingAction: null,
        pendingFlip3: null,
      },
    },
    playerStates: {},
    events: [],
    matchUpdateContext: {},
  };
}

describe("resolveMatchPatch", () => {
  it("increments the match version and updates timestamp", () => {
    const patch = resolveMatchPatch(baseMatch(), baseTransition(), playerIds, 2500);

    expect(patch).toEqual({
      version: 4,
      updatedAt: 2500,
    });
  });

  it("applies transitional match update context when present", () => {
    const transition: GameTransition = {
      ...baseTransition(),
      matchUpdateContext: {
        nextMatchStatus: "in_progress",
        nextCurrentRoundNumber: 2,
        nextDealerSeat: 1,
      },
    };

    const patch = resolveMatchPatch(baseMatch(), transition, playerIds, 2500);

    expect(patch).toEqual({
      version: 4,
      updatedAt: 2500,
      status: "in_progress",
      currentRoundNumber: 2,
      dealerSeat: 1,
    });
  });

  it("prioritizes finalized matchPatch and resolves winner player ID", () => {
    const transition: GameTransition = {
      ...baseTransition(),
      matchUpdateContext: {
        nextMatchStatus: "in_progress",
        nextCurrentRoundNumber: 2,
        nextDealerSeat: 1,
      },
      finalized: {
        round: baseTransition().roundWrite.round,
        playerStates: {},
        events: [],
        scoreBreakdowns: {},
        playerScorePatches: {},
        matchPatch: {
          status: "completed",
          winnerPlayerId: "p2",
        },
        matchCompleted: true,
      },
    };

    const patch = resolveMatchPatch(baseMatch(), transition, playerIds, 3000);

    expect(patch).toEqual({
      version: 4,
      updatedAt: 3000,
      status: "completed",
      currentRoundNumber: 2,
      dealerSeat: 1,
      winnerPlayerId: "p2-doc" as Id<"players">,
    });
  });
});
