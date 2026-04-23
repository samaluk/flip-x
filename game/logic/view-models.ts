import type { ActionKind, ModifierCard, NumberCard } from "./card-types";
import { scoreRound } from "./scoring";
import type {
  OrderedPlayer,
  PendingAction,
  PlayerRoundState,
  RoundEvent,
  RoundRuntime,
} from "./turn-resolution";

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
  targetScore: number;
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
  latestEvent: {
    type: string;
    payload: Record<string, unknown>;
    actorPlayerId?: string | null;
    targetPlayerId?: string | null;
    playerNames?: string;
  } | null;
  roundHistory: RoundHistoryEntry[];
};

export type CanonicalReplayStepState = Pick<
  MatchSnapshot,
  | "status"
  | "currentRoundNumber"
  | "dealerSeat"
  | "activePlayerId"
  | "pendingAction"
  | "pendingFlip3"
  | "roundStatus"
  | "endedBy"
  | "latestEvent"
> & {
  players: MatchSnapshot["players"];
};

export function buildMatchSnapshot(args: {
  matchId: string;
  status: MatchSnapshot["status"];
  lobbyCode?: string;
  hostPlayerId?: string | null;
  targetScore: number;
  currentRoundNumber: number;
  dealerSeat: number;
  viewerPlayerId: string | null;
  round: RoundRuntime | null;
  players: Array<{
    playerId: string;
    displayName: string;
    seatIndex: number;
    totalScore: number;
    isOnline: boolean;
  }>;
  playerStates: Record<string, PlayerRoundState>;
  latestEvent: RoundEvent | null;
  roundHistory: RoundHistoryEntry[];
}) {
  const result: Record<string, unknown> = {
    matchId: args.matchId,
    status: args.status,
    targetScore: args.targetScore,
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
    roundHistory: args.roundHistory,
  };

  if (args.lobbyCode) result.lobbyCode = args.lobbyCode;
  if (args.hostPlayerId && args.viewerPlayerId) {
    result.isHost = args.hostPlayerId === args.viewerPlayerId;
  }

  result.players = [...args.players]
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
        seatIndex: player.seatIndex,
        totalScore: player.totalScore,
        isOnline: player.isOnline,
        roundStatus: playerState.status,
        pointsAtRisk: playerState.pointsAtRisk,
        numberCards: playerState.numberCards,
        modifierCards: playerState.modifierCards,
        heldActionCards: playerState.heldActionCards.map(
          (card: { label: string; actionKind: ActionKind }) => ({
            label: card.label,
            actionKind: card.actionKind,
          }),
        ),
        receivedActionCards: playerState.receivedActionCards.map(
          (card: { label: string; actionKind: ActionKind }) => ({
            label: card.label,
            actionKind: card.actionKind,
          }),
        ),
        scoreBreakdown: scoreRound(
          playerState.numberCards,
          playerState.modifierCards,
          playerState.hasFlip7,
        ),
        bustCard: playerState.bustCard ?? null,
      };
    });

  if (args.latestEvent) {
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
    result.latestEvent = {
      type: args.latestEvent.eventType,
      payload: args.latestEvent.payload,
      actorPlayerId: args.latestEvent.actorPlayerId,
      targetPlayerId: args.latestEvent.targetPlayerId,
      playerNames,
    };
  } else {
    result.latestEvent = null;
  }

  return result as MatchSnapshot;
}

export function toOrderedPlayers(players: Array<{ playerId: string; seatIndex: number }>) {
  return [...players]
    .toSorted((left, right) => left.seatIndex - right.seatIndex)
    .map((player) => ({
      playerId: player.playerId,
      seatIndex: player.seatIndex,
    })) satisfies OrderedPlayer[];
}

export function toCanonicalReplayStepState(snapshot: MatchSnapshot): CanonicalReplayStepState {
  return {
    status: snapshot.status,
    currentRoundNumber: snapshot.currentRoundNumber,
    dealerSeat: snapshot.dealerSeat,
    activePlayerId: snapshot.activePlayerId,
    pendingAction: snapshot.pendingAction,
    pendingFlip3: snapshot.pendingFlip3,
    roundStatus: snapshot.roundStatus,
    endedBy: snapshot.endedBy,
    players: [...snapshot.players].toSorted((left, right) => left.seatIndex - right.seatIndex),
    latestEvent: snapshot.latestEvent
      ? {
          type: snapshot.latestEvent.type,
          payload: snapshot.latestEvent.payload,
          actorPlayerId: snapshot.latestEvent.actorPlayerId,
          targetPlayerId: snapshot.latestEvent.targetPlayerId,
          playerNames: snapshot.latestEvent.playerNames,
        }
      : null,
  };
}
