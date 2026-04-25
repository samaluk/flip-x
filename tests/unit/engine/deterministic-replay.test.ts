import { describe, expect, it } from "vitest";

import type { MatchSnapshot } from "@/game/logic/view-models";
import {
  DIVERGED_REPLAY_SCENARIO,
  INCOMPLETE_REPLAY_SCENARIO,
  MATCH_REPLAY_SCENARIO,
  cloneReplayScenario,
  describeReplayResult,
  runDeterministicReplayScenario,
  type CanonicalReplaySnapshot,
  type ReplayHarness,
} from "@/tests/fixtures/deterministic";

function snapshotFromCanonical(state: CanonicalReplaySnapshot): MatchSnapshot {
  const playerIds = new Map(
    state.players.map((player, index) => [player.displayName, `p${index + 1}`]),
  );

  return {
    matchId: "match-1",
    status: state.status,
    targetScore: 200,
    currentRoundNumber: state.currentRoundNumber,
    dealerSeat: state.dealerSeat,
    viewerPlayerId: null,
    activePlayerId: state.activePlayer ? (playerIds.get(state.activePlayer) ?? null) : null,
    pendingAction: state.pendingAction
      ? {
          actionKind: state.pendingAction.actionKind,
          sourcePlayerId: playerIds.get(state.pendingAction.sourcePlayer)!,
          eligibleTargetIds: state.pendingAction.eligibleTargets.map(
            (target) => playerIds.get(target)!,
          ),
          resume: state.pendingAction.resume,
        }
      : null,
    pendingFlip3: state.pendingFlip3
      ? {
          sourcePlayerId: playerIds.get(state.pendingFlip3.sourcePlayer)!,
          targetPlayerId: playerIds.get(state.pendingFlip3.targetPlayer)!,
          cardsRemaining: state.pendingFlip3.cardsRemaining,
          deferredActionCards: state.pendingFlip3.deferredActionCards as never,
        }
      : null,
    roundStatus: state.roundStatus,
    endedBy: state.endedBy,
    players: state.players.map((player) => ({
      playerId: playerIds.get(player.displayName)!,
      displayName: player.displayName,
      seatIndex: player.seatIndex,
      totalScore: player.totalScore,
      isOnline: true,
      roundStatus: player.roundStatus,
      pointsAtRisk: player.pointsAtRisk,
      numberCards: player.numberCards.map((numberValue, index) => ({
        id: `${player.displayName}-n-${index}`,
        type: "number" as const,
        label: String(numberValue),
        numberValue,
      })),
      modifierCards: player.modifierCards.map((modifierValue, index) => ({
        id: `${player.displayName}-m-${index}`,
        type: "modifier" as const,
        label: modifierValue === "x2" ? "x2" : `+${modifierValue}`,
        modifierValue,
      })),
      heldActionCards: player.heldActionCards.map((actionKind) => ({
        label: actionKind,
        actionKind: actionKind as never,
      })),
      receivedActionCards: player.receivedActionCards.map((actionKind) => ({
        label: actionKind,
        actionKind: actionKind as never,
      })),
      bustCard: null,
      scoreBreakdown: {
        numberCardTotal: player.numberCards.reduce((sum, value) => sum + value, 0),
        multiplierApplied: false,
        multipliedTotal: player.numberCards.reduce((sum, value) => sum + value, 0),
        additiveModifierTotal: 0,
        flip7Bonus: 0,
        finalRoundScore: player.pointsAtRisk,
      },
    })),
    latestEvent: state.latestEvent
      ? {
          type: state.latestEvent.type,
          payload: state.latestEvent.payload,
          playerNames: state.latestEvent.playerNames ?? undefined,
        }
      : null,
    roundHistory: [],
  };
}

function makeHarness(states: CanonicalReplaySnapshot[]): ReplayHarness {
  let index = 0;

  return {
    createStartedMatch: async () => ({
      matchId: "match-1",
      sessions: [
        { name: "Host", sessionId: "session-1" },
        { name: "Guest", sessionId: "session-2" },
      ],
      started: snapshotFromCanonical(MATCH_REPLAY_SCENARIO.expectedStates[0]!),
    }),
    advanceUntilRoundBoundary: async () => snapshotFromCanonical(states[index]!),
    startDeterministicNextRound: async () => snapshotFromCanonical(states[index]!),
    takeTurn: async () => snapshotFromCanonical(states[index++]!),
    resolveAction: async () => snapshotFromCanonical(states[index++]!),
  };
}

describe("deterministic replay runner", () => {
  it("reports the first mismatched step", async () => {
    const scenario = cloneReplayScenario(DIVERGED_REPLAY_SCENARIO);
    const harness = makeHarness(MATCH_REPLAY_SCENARIO.expectedStates);

    const result = await runDeterministicReplayScenario(scenario, harness);

    expect(result.status).toBe("diverged");
    if (result.status !== "diverged") {
      return;
    }

    expect(result.divergence.stepNumber).toBe(2);
    expect(describeReplayResult(result)).toContain("diverged at step 2");
  });

  it("reports an invalid result when the script ends before the round boundary", async () => {
    const scenario = cloneReplayScenario(INCOMPLETE_REPLAY_SCENARIO);
    const harness = makeHarness(MATCH_REPLAY_SCENARIO.expectedStates);

    const result = await runDeterministicReplayScenario(scenario, harness);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") {
      return;
    }

    expect(result.validationError).toContain("ended before gameplay reached a round boundary");
  });
});
