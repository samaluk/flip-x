import { expect } from "vitest";

import type { CanonicalReplaySnapshot, ReplayResult } from "./scenario-types";
import type { ConfectMatchSnapshot } from "./confect-match-snapshot";

export function canonicalizeSnapshot(snapshot: ConfectMatchSnapshot): CanonicalReplaySnapshot {
  const playerNames = new Map(
    snapshot.players.map((player) => [player.playerId, player.displayName]),
  );

  return {
    status: snapshot.status,
    currentRoundNumber: snapshot.currentRoundNumber,
    dealerSeat: snapshot.dealerSeat,
    activePlayer: snapshot.activePlayerId
      ? (playerNames.get(snapshot.activePlayerId) ?? null)
      : null,
    roundStatus: snapshot.roundStatus,
    endedBy: snapshot.endedBy,
    pendingAction: snapshot.pendingAction
      ? {
          actionKind: snapshot.pendingAction.actionKind,
          sourcePlayer:
            playerNames.get(snapshot.pendingAction.sourcePlayerId) ??
            snapshot.pendingAction.sourcePlayerId,
          eligibleTargets: snapshot.pendingAction.eligibleTargetIds.map(
            (playerId) => playerNames.get(playerId) ?? playerId,
          ),
          resume: snapshot.pendingAction.resume,
        }
      : null,
    pendingFlip3: snapshot.pendingFlip3
      ? {
          sourcePlayer:
            playerNames.get(snapshot.pendingFlip3.sourcePlayerId) ??
            snapshot.pendingFlip3.sourcePlayerId,
          targetPlayer:
            playerNames.get(snapshot.pendingFlip3.targetPlayerId) ??
            snapshot.pendingFlip3.targetPlayerId,
          cardsRemaining: snapshot.pendingFlip3.cardsRemaining,
          deferredActionCards: snapshot.pendingFlip3.deferredActionCards,
        }
      : null,
    players: snapshot.players.map((player) => ({
      displayName: player.displayName,
      seatIndex: player.seatIndex,
      totalScore: player.totalScore,
      roundStatus: player.roundStatus,
      pointsAtRisk: player.pointsAtRisk,
      numberCards: player.numberCards.map((card) => card.numberValue),
      modifierCards: player.modifierCards.map((card) => card.modifierValue),
      heldActionCards: player.heldActionCards.map((card) => card.actionKind),
      receivedActionCards: player.receivedActionCards.map((card) => card.actionKind),
    })),
    latestEvent: snapshot.latestEvent
      ? {
          type: snapshot.latestEvent.type,
          payload: snapshot.latestEvent.payload,
          playerNames: snapshot.latestEvent.playerNames ?? null,
        }
      : null,
  };
}

export function expectSnapshotToMatchExpected(
  snapshot: ConfectMatchSnapshot,
  expected: CanonicalReplaySnapshot,
  message?: string,
) {
  expect(canonicalizeSnapshot(snapshot), message).toEqual(expected);
}

export function describeReplayResult(result: ReplayResult) {
  switch (result.status) {
    case "matched":
      return `${result.scenarioName} matched after ${result.stepsConsumed} steps`;
    case "invalid":
      return `${result.scenarioName} invalid after ${result.stepsConsumed} steps: ${result.validationError}`;
    case "diverged":
      return `${result.scenarioName} diverged at step ${result.divergence.stepNumber}: ${result.divergence.message}`;
  }
}

export function expectReplayToMatch(result: ReplayResult) {
  expect(result.status, describeReplayResult(result)).toBe("matched");
}

export function expectSnapshotsToMatch(
  left: ConfectMatchSnapshot,
  right: ConfectMatchSnapshot,
  message?: string,
) {
  expect(canonicalizeSnapshot(left), message).toEqual(canonicalizeSnapshot(right));
}
