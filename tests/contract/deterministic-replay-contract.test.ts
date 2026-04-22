import { describe, expect, it } from "vitest";

import { buildMatchSnapshot } from "@/game/logic/view-models";
import {
  MATCH_REPLAY_SCENARIO,
  canonicalizeSnapshot,
  type ReplayResult,
  ROUND_REPLAY_SCENARIO,
} from "@/tests/fixtures/deterministic";

describe("deterministic replay contract", () => {
  it("canonical replay snapshots use readable player-based state", () => {
    const snapshot = buildMatchSnapshot({
      matchId: "match-1",
      status: "in_progress",
      hostPlayerId: "p1",
      viewerPlayerId: "p1",
      targetScore: 200,
      currentRoundNumber: 1,
      dealerSeat: 0,
      round: {
        phase: "player_turns",
        roundNumber: 1,
        dealerSeat: 0,
        drawPile: [],
        discardPile: [],
        openingSeatIndex: 0,
        turnSeatIndex: 1,
        activePlayerId: "p2",
        endedBy: "unknown",
        pendingAction: null,
        pendingFlip3: null,
      },
      players: [
        { playerId: "p1", displayName: "Host", seatIndex: 0, totalScore: 0, isOnline: true },
        { playerId: "p2", displayName: "Guest", seatIndex: 1, totalScore: 0, isOnline: true },
      ],
      playerStates: {
        p1: {
          playerId: "p1",
          status: "stayed",
          numberCards: [],
          modifierCards: [],
          heldActionCards: [],
          receivedActionCards: [],
          roundScore: 0,
          pointsAtRisk: 1,
          hasFlip7: false,
        },
        p2: {
          playerId: "p2",
          status: "active",
          numberCards: [],
          modifierCards: [],
          heldActionCards: [],
          receivedActionCards: [],
          roundScore: 0,
          pointsAtRisk: 7,
          hasFlip7: false,
        },
      },
      latestEvent: {
        eventType: "stay",
        actorPlayerId: "p1",
        targetPlayerId: "p1",
        payload: {},
      },
    });

    expect(canonicalizeSnapshot(snapshot)).toEqual(
      expect.objectContaining({
        status: "in_progress",
        currentRoundNumber: 1,
        dealerSeat: 0,
        activePlayer: "Guest",
        players: expect.arrayContaining([
          expect.objectContaining({ displayName: "Host", roundStatus: "stayed" }),
        ]),
        latestEvent: expect.objectContaining({ type: "stay", playerNames: "Host" }),
      }),
    );
  });

  it("replay fixtures expose the expected decision and result contract fields", () => {
    const matchedResult: ReplayResult = {
      scenarioName: MATCH_REPLAY_SCENARIO.name,
      scope: MATCH_REPLAY_SCENARIO.scope,
      status: "matched",
      stepsConsumed: MATCH_REPLAY_SCENARIO.decisionScript.length,
      finalOutcome: MATCH_REPLAY_SCENARIO.expectedStates.at(-1)!,
    };

    expect(matchedResult).toEqual(
      expect.objectContaining({
        scenarioName: "match-replay-stays",
        scope: "match",
        status: "matched",
        stepsConsumed: 2,
        finalOutcome: expect.objectContaining({ roundStatus: "completed" }),
      }),
    );

    expect(ROUND_REPLAY_SCENARIO.decisionScript[1]).toEqual(
      expect.objectContaining({
        decisionType: "target_confirmation",
        promptKind: "freeze",
        choice: "Third",
      }),
    );
  });
});
