import type { ConfectMatchSnapshot } from "./confect-match-snapshot";
import type { ReplayExpectedState, ReplayHarness } from "./scenario-types";

const STUB_PLAYER_NAMES = ["Host", "Guest", "Third"] as const;

/** Canonical snapshot conversion for stub replay harnesses (test-only). */
export function snapshotFromExpectedFacts(state: ReplayExpectedState): ConfectMatchSnapshot {
  const playerIds = new Map(STUB_PLAYER_NAMES.map((name, index) => [name, `p${index + 1}`]));
  const activePlayer = state.activePlayer ?? null;

  return {
    matchId: "match-1",
    status: state.status ?? "in_progress",
    version: 1,
    targetScore: 200,
    settings: {
      targetScore: 200,
      maxNumberCardValue: 12,
      numberCardRange: { min: 0 as const, max: 12 },
      modifierRange: { min: 2 as const, max: 10, includesX2: true as const },
      modeLabel: "Classic Game",
    },
    currentRoundNumber: state.currentRoundNumber ?? 1,
    dealerSeat: state.dealerSeat ?? 0,
    viewerPlayerId: null,
    activePlayerId: activePlayer ? (playerIds.get(activePlayer) ?? null) : null,
    pendingAction: state.pendingAction
      ? {
          actionKind: state.pendingAction.actionKind,
          sourcePlayerId: playerIds.get(state.pendingAction.sourcePlayer)!,
          eligibleTargetIds: state.pendingAction.eligibleTargets.map((target) =>
            playerIds.get(target)!,
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
    roundStatus: state.roundStatus ?? "player_turns",
    endedBy: state.endedBy ?? "unknown",
    players: STUB_PLAYER_NAMES.filter((name) => state.players?.[name]).map((displayName, index) => {
      const player = state.players![displayName]!;
      const numberCards = player.numberCards ?? [];
      return {
        playerId: playerIds.get(displayName)!,
        displayName,
        seatIndex: player.seatIndex ?? index,
        totalScore: player.totalScore ?? 0,
        isOnline: true,
        roundStatus: player.roundStatus ?? "active",
        pointsAtRisk: player.pointsAtRisk ?? 0,
        numberCards: numberCards.map((numberValue, cardIndex) => ({
          id: `${displayName}-n-${cardIndex}`,
          type: "number" as const,
          label: String(numberValue),
          numberValue,
        })),
        modifierCards: (player.modifierCards ?? []).map((modifierValue, cardIndex) => ({
          id: `${displayName}-m-${cardIndex}`,
          type: "modifier" as const,
          label: modifierValue === "x2" ? "x2" : `+${modifierValue}`,
          modifierValue,
        })),
        heldActionCards: (player.heldActionCards ?? []).map((actionKind) => ({
          label: actionKind,
          actionKind: actionKind as never,
        })),
        receivedActionCards: (player.receivedActionCards ?? []).map((actionKind) => ({
          label: actionKind,
          actionKind: actionKind as never,
        })),
        bustCard: null,
        scoreBreakdown: {
          numberCardTotal: numberCards.reduce((sum, value) => sum + value, 0),
          multiplierApplied: false,
          multipliedTotal: numberCards.reduce((sum, value) => sum + value, 0),
          additiveModifierTotal: 0,
          flip7Bonus: 0,
          finalRoundScore: player.pointsAtRisk ?? 0,
        },
      };
    }),
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

/** Stub harness that replays canned game-language facts as snapshots. */
export function createStubReplayHarness(states: ReplayExpectedState[]): ReplayHarness {
  let index = 0;

  return {
    createStartedMatch: async () => ({
      matchId: "match-1",
      sessions: [
        { name: "Host", sessionId: "session-1" },
        { name: "Guest", sessionId: "session-2" },
      ],
      started: snapshotFromExpectedFacts(states[0]!),
    }),
    advanceUntilRoundBoundary: async () => snapshotFromExpectedFacts(states[index]!),
    startDeterministicNextRound: async () => snapshotFromExpectedFacts(states[index]!),
    takeTurn: async () => snapshotFromExpectedFacts(states[index++]!),
    resolveAction: async () => snapshotFromExpectedFacts(states[index++]!),
  };
}
