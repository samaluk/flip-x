import { buildMatchSnapshot } from "@/game/logic/view-models";
import type { Id } from "@/convex/_generated/dataModel";

import { playerRoundState } from "./player-round-state";

type MatchSnapshotArgs = Parameters<typeof buildMatchSnapshot>[0];

export function matchSnapshotArgs(overrides: Partial<MatchSnapshotArgs> = {}): MatchSnapshotArgs {
  return {
    matchId: "match-1" as Id<"matches">,
    status: "in_progress",
    version: 1,
    hostPlayerId: null,
    targetScore: 200,
    currentRoundNumber: 1,
    dealerSeat: 0,
    viewerPlayerId: null,
    round: null,
    players: [
      {
        playerId: "p1" as Id<"players">,
        displayName: "Alex",
        seatIndex: 0,
        totalScore: 0,
        isOnline: true,
      },
    ],
    playerStates: {
      p1: playerRoundState({ playerId: "p1" }),
    },
    latestEvent: null,
    roundHistory: [],
    ...overrides,
  };
}

export function buildTestMatchSnapshot(overrides: Partial<MatchSnapshotArgs> = {}) {
  return buildMatchSnapshot(matchSnapshotArgs(overrides));
}
