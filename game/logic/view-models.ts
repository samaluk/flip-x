import type { ActionKind, ModifierCard, NumberCard } from "./card-types";
import { scoreRound } from "./scoring";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";
import type { RoundEvent } from "./events";
import {
  buildGameSettingsSnapshot,
  settingsFromMatch,
  type GameSettings,
  type GameSettingsSnapshot,
} from "./game-settings";

type LatestRoundEvent = {
  [TEvent in RoundEvent as TEvent["eventType"]]: {
    type: TEvent["eventType"];
    payload: TEvent["payload"];
    actorPlayerId?: TEvent["actorPlayerId"];
    targetPlayerId?: TEvent["targetPlayerId"];
    playerNames?: string;
  };
}[RoundEvent["eventType"]];

export type RoundHistoryEntry = {
  roundNumber: number;
  phase: "completed" | "projected";
  isCurrentRound: boolean;
  scores: Array<{
    playerId: string;
    roundScore: number;
    totalScore: number;
    pointsToTarget: number;
    reachedTarget: boolean;
  }>;
};

export type MatchSnapshot = {
  matchId: string;
  lobbyCode?: string;
  isHost?: boolean;
  status: "setup" | "in_progress" | "completed";
  version: number;
  targetScore: number;
  settings: GameSettingsSnapshot;
  currentRoundNumber: number;
  dealerSeat: number;
  viewerPlayerId: string | null;
  activePlayerId: string | null;
  pendingAction: PendingAction | null;
  pendingFlip3: {
    sourcePlayerId: string;
    targetPlayerId: string;
    cardsRemaining: number;
    deferredActionCards: Array<{ label: string; actionKind: ActionKind }>;
  } | null;
  roundStatus: RoundRuntime["phase"] | null;
  endedBy: RoundRuntime["endedBy"] | null;
  players: Array<{
    playerId: string;
    displayName: string;
    colorId?: string;
    seatIndex: number;
    totalScore: number;
    isOnline: boolean;
    roundStatus: PlayerRoundState["status"];
    pointsAtRisk: number;
    numberCards: NumberCard[];
    modifierCards: ModifierCard[];
    heldActionCards: Array<{ label: string; actionKind: ActionKind }>;
    receivedActionCards: Array<{ label: string; actionKind: ActionKind }>;
    scoreBreakdown: ReturnType<typeof scoreRound>;
    bustCard: NumberCard | null;
  }>;
  latestEvent: LatestRoundEvent | null;
  roundHistory: RoundHistoryEntry[];
};

function toLatestRoundEvent<TEvent extends RoundEvent>(
  event: TEvent,
  playerNames: string | undefined,
): LatestRoundEvent {
  return {
    actorPlayerId: event.actorPlayerId,
    targetPlayerId: event.targetPlayerId,
    playerNames,
    type: event.eventType,
    payload: event.payload,
  } as LatestRoundEvent;
}

export function buildMatchSnapshot(args: {
  matchId: string;
  status: MatchSnapshot["status"];
  version: number;
  lobbyCode?: string;
  hostPlayerId?: string | null;
  targetScore: number;
  settings?: GameSettings;
  currentRoundNumber: number;
  dealerSeat: number;
  viewerPlayerId: string | null;
  round: RoundRuntime | null;
  players: Array<{
    playerId: string;
    displayName: string;
    colorId?: string;
    seatIndex: number;
    totalScore: number;
    isOnline: boolean;
  }>;
  playerStates: Record<string, PlayerRoundState>;
  latestEvent: RoundEvent | null;
  roundHistory: RoundHistoryEntry[];
}): MatchSnapshot {
  const settings = buildGameSettingsSnapshot(
    args.settings ?? settingsFromMatch({ targetScore: args.targetScore }),
  );
  const players = [...args.players]
    .toSorted((left, right) => left.seatIndex - right.seatIndex)
    .map((player) => {
      const playerState = args.playerStates[player.playerId] ?? {
        playerId: player.playerId,
        status: "waiting",
        numberCards: [],
        modifierCards: [],
        heldActionCards: [],
        receivedActionCards: [],
        roundScore: 0,
        pointsAtRisk: 0,
        hasFlip7: false,
        bustCard: null,
      };

      return {
        playerId: player.playerId,
        displayName: player.displayName,
        colorId: player.colorId,
        seatIndex: player.seatIndex,
        totalScore: player.totalScore,
        isOnline: player.isOnline,
        roundStatus: playerState.status,
        pointsAtRisk: playerState.pointsAtRisk,
        numberCards: playerState.numberCards,
        modifierCards: playerState.modifierCards,
        heldActionCards: playerState.heldActionCards.map((card) => ({
          label: card.label,
          actionKind: card.actionKind,
        })),
        receivedActionCards: playerState.receivedActionCards.map((card) => ({
          label: card.label,
          actionKind: card.actionKind,
        })),
        scoreBreakdown: scoreRound(
          playerState.numberCards,
          playerState.modifierCards,
          playerState.hasFlip7,
        ),
        bustCard: playerState.bustCard ?? null,
      };
    });

  const latestEvent = args.latestEvent
    ? (() => {
        const playerMap = new Map(args.players.map((p) => [p.playerId, p.displayName]));
        const actorName = args.latestEvent.actorPlayerId
          ? playerMap.get(args.latestEvent.actorPlayerId)
          : null;
        const targetName =
          args.latestEvent.targetPlayerId &&
          args.latestEvent.targetPlayerId !== args.latestEvent.actorPlayerId
            ? playerMap.get(args.latestEvent.targetPlayerId)
            : null;
        let playerNames: string | undefined;
        if (actorName && targetName && actorName !== targetName) {
          playerNames = `${actorName} → ${targetName}`;
        } else if (actorName) {
          playerNames = actorName;
        }
        return toLatestRoundEvent(args.latestEvent, playerNames);
      })()
    : null;

  return {
    matchId: args.matchId,
    status: args.status,
    version: args.version,
    targetScore: args.targetScore,
    settings,
    currentRoundNumber: args.currentRoundNumber,
    dealerSeat: args.dealerSeat,
    viewerPlayerId: args.viewerPlayerId,
    activePlayerId: args.round?.activePlayerId ?? null,
    pendingAction: args.round?.pendingAction ?? null,
    pendingFlip3: args.round?.pendingFlip3
      ? {
          sourcePlayerId: args.round.pendingFlip3.sourcePlayerId,
          targetPlayerId: args.round.pendingFlip3.targetPlayerId,
          cardsRemaining: args.round.pendingFlip3.cardsRemaining,
          deferredActionCards: args.round.pendingFlip3.deferredActionCards.map((card) => ({
            label: card.label,
            actionKind: card.actionKind,
          })),
        }
      : null,
    roundStatus: args.round?.phase ?? null,
    endedBy: args.round?.endedBy ?? null,
    players,
    latestEvent,
    roundHistory: args.roundHistory,
    ...(args.lobbyCode ? { lobbyCode: args.lobbyCode } : {}),
    ...(args.hostPlayerId && args.viewerPlayerId
      ? { isHost: args.hostPlayerId === args.viewerPlayerId }
      : {}),
  };
}

export function toOrderedPlayers(players: Array<{ playerId: string; seatIndex: number }>) {
  return [...players]
    .toSorted((left, right) => left.seatIndex - right.seatIndex)
    .map((player) => ({
      playerId: player.playerId,
      seatIndex: player.seatIndex,
    })) satisfies OrderedPlayer[];
}
