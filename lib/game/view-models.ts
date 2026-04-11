import type { ActionKind, ModifierCard, NumberCard } from "./card-types";
import { scoreRound } from "./scoring";
import type {
  OrderedPlayer,
  PendingAction,
  PlayerRoundState,
  RoundEvent,
  RoundRuntime,
} from "./turn-resolution";

export type MatchSnapshot = {
  matchId: string;
  status: "setup" | "in_progress" | "completed";
  targetScore: number;
  currentRoundNumber: number;
  dealerSeat: number;
  viewerPlayerId: string | null;
  activePlayerId: string | null;
  pendingAction: PendingAction | null;
  roundStatus: RoundRuntime["phase"] | null;
  endedBy: RoundRuntime["endedBy"] | null;
  players: Array<{
    playerId: string;
    displayName: string;
    seatIndex: number;
    totalScore: number;
    isClaimed: boolean;
    roundStatus: PlayerRoundState["status"];
    pointsAtRisk: number;
    numberCards: NumberCard[];
    modifierCards: ModifierCard[];
    heldActionCards: Array<{ label: string; actionKind: ActionKind }>;
    scoreBreakdown: ReturnType<typeof scoreRound>;
  }>;
  latestEvent: {
    type: string;
    summary: string;
    actorPlayerId?: string | null;
    targetPlayerId?: string | null;
    playerNames?: string;
  } | null;
};

export function buildMatchSnapshot(args: {
  matchId: string;
  status: MatchSnapshot["status"];
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
    isClaimed: boolean;
  }>;
  playerStates: Record<string, PlayerRoundState>;
  latestEvent: RoundEvent | null;
}) {
  return {
    matchId: args.matchId,
    status: args.status,
    targetScore: args.targetScore,
    currentRoundNumber: args.currentRoundNumber,
    dealerSeat: args.dealerSeat,
    viewerPlayerId: args.viewerPlayerId,
    activePlayerId: args.round?.activePlayerId ?? null,
    pendingAction: args.round?.pendingAction ?? null,
    roundStatus: args.round?.phase ?? null,
    endedBy: args.round?.endedBy ?? null,
    players: [...args.players]
      .toSorted((left, right) => left.seatIndex - right.seatIndex)
      .map((player) => {
        const playerState = args.playerStates[player.playerId] ?? {
          playerId: player.playerId,
          status: "waiting",
          numberCards: [],
          modifierCards: [],
          heldActionCards: [],
          roundScore: 0,
          pointsAtRisk: 0,
          hasFlip7: false,
        };

        return {
          playerId: player.playerId,
          displayName: player.displayName,
          seatIndex: player.seatIndex,
          totalScore: player.totalScore,
          isClaimed: player.isClaimed,
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
          scoreBreakdown: scoreRound(
            playerState.numberCards,
            playerState.modifierCards,
            playerState.hasFlip7,
          ),
        };
      }),
    latestEvent: args.latestEvent
      ? {
          type: args.latestEvent.eventType,
          summary: args.latestEvent.summary,
          actorPlayerId: args.latestEvent.actorPlayerId,
          targetPlayerId: args.latestEvent.targetPlayerId,
          playerNames: (() => {
            const playerMap = new Map(args.players.map((p) => [p.playerId, p.displayName]));
            const actorName = args.latestEvent.actorPlayerId
              ? playerMap.get(args.latestEvent.actorPlayerId) ?? "Unknown"
              : null;
            const targetName =
              args.latestEvent.targetPlayerId && args.latestEvent.targetPlayerId !== args.latestEvent.actorPlayerId
                ? playerMap.get(args.latestEvent.targetPlayerId) ?? "Unknown"
                : null;
            if (actorName && targetName && actorName !== targetName) {
              return `${actorName} → ${targetName}`;
            }
            if (actorName) {
              return actorName;
            }
            return undefined;
          })(),
        }
      : null,
  } satisfies MatchSnapshot;
}

export function toOrderedPlayers(players: Array<{ playerId: string; seatIndex: number }>) {
  return [...players]
    .toSorted((left, right) => left.seatIndex - right.seatIndex)
    .map((player) => ({
      playerId: player.playerId,
      seatIndex: player.seatIndex,
    })) satisfies OrderedPlayer[];
}
