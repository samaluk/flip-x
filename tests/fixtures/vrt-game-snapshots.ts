import type { ActionKind, ModifierCard, NumberCard } from "@/game/logic/card-types";
import { scoreRound } from "@/game/logic/scoring";
import type { MatchSnapshot } from "@/game/logic/view-models";
import type { PlayerRoundStatus } from "@/game/logic/turn-resolution";

const MATCH_ID = "jz7abcd1234567890";

function numbers(pairs: Array<{ label: string; value: number }>): NumberCard[] {
  return pairs.map(({ label, value }) => ({
    id: `n-${label}-${value}`,
    type: "number" as const,
    label,
    numberValue: value,
  }));
}

function modifiers(
  items: Array<{ id: string; value: ModifierCard["modifierValue"] }>,
): ModifierCard[] {
  return items.map(({ id, value }) => ({
    id: `m-${id}`,
    type: "modifier" as const,
    label: typeof value === "number" ? `+${value}` : "x2",
    modifierValue: value,
  }));
}

function held(actions: Array<{ label: string; kind: ActionKind }>) {
  return actions.map(({ label, kind }) => ({ label, actionKind: kind }));
}

type PlayerArgs = {
  playerId: string;
  displayName: string;
  seatIndex: number;
  totalScore: number;
  roundStatus: PlayerRoundStatus;
  pointsAtRisk: number;
  numberCards: NumberCard[];
  bustCard?: NumberCard | null;
  modifierCards: ModifierCard[];
  heldActionCards: Array<{ label: string; actionKind: ActionKind }>;
  receivedActionCards?: Array<{ label: string; actionKind: ActionKind }>;
};

function playerRow(args: PlayerArgs): MatchSnapshot["players"][number] {
  const hasFlip7 = args.numberCards.length >= 7;
  return {
    playerId: args.playerId,
    displayName: args.displayName,
    seatIndex: args.seatIndex,
    totalScore: args.totalScore,
    isOnline: true,
    roundStatus: args.roundStatus as PlayerRoundStatus,
    pointsAtRisk: args.pointsAtRisk,
    numberCards: args.numberCards,
    bustCard: args.bustCard ?? null,
    modifierCards: args.modifierCards,
    heldActionCards: args.heldActionCards,
    receivedActionCards: args.receivedActionCards ?? [],
    scoreBreakdown: scoreRound(args.numberCards, args.modifierCards, hasFlip7),
  };
}

const RILEY = "p_riley_viewer";
const SAM = "p_sam_opponent";
const JORDAN = "p_jordan_opponent";

/** Three-player table: your turn, opponents waiting / busted; dealer is Sam. */
export const vrtSnapshotMidRound: MatchSnapshot = {
  matchId: MATCH_ID,
  status: "in_progress",
  targetScore: 200,
  currentRoundNumber: 3,
  dealerSeat: 1,
  viewerPlayerId: RILEY,
  activePlayerId: RILEY,
  pendingAction: null,
  pendingFlip3: null,
  roundStatus: "player_turns",
  endedBy: null,
  players: [
    playerRow({
      playerId: RILEY,
      displayName: "Riley",
      seatIndex: 0,
      totalScore: 42,
      roundStatus: "active",
      pointsAtRisk: 28,
      modifierCards: modifiers([{ id: "x2", value: "x2" }]),
      numberCards: numbers([
        { label: "A", value: 3 },
        { label: "B", value: 7 },
        { label: "C", value: 11 },
      ]),
      heldActionCards: held([{ label: "F1", kind: "freeze" }]),
    }),
    playerRow({
      playerId: SAM,
      displayName: "Sam",
      seatIndex: 1,
      totalScore: 55,
      roundStatus: "waiting",
      pointsAtRisk: 18,
      modifierCards: modifiers([{ id: "p4", value: 4 }]),
      numberCards: numbers([
        { label: "S1", value: 2 },
        { label: "S2", value: 6 },
        { label: "S3", value: 8 },
      ]),
      heldActionCards: [],
    }),
    playerRow({
      playerId: JORDAN,
      displayName: "Jordan",
      seatIndex: 2,
      totalScore: 30,
      roundStatus: "busted",
      pointsAtRisk: 0,
      modifierCards: modifiers([{ id: "j10", value: 10 }]),
      numberCards: numbers([
        { label: "J1", value: 4 },
        { label: "J2", value: 9 },
      ]),
      bustCard: { id: "n-J3-9", type: "number", label: "J3", numberValue: 9 },
      heldActionCards: held([{ label: "J3", kind: "flip_three" }]),
    }),
  ],
  latestEvent: {
    type: "number_drawn",
    payload: { numberValue: 11 },
    actorPlayerId: RILEY,
    targetPlayerId: RILEY,
    playerNames: "Riley",
  },
};

/** Viewer must pick a freeze target. */
export const vrtSnapshotPendingFreeze: MatchSnapshot = {
  ...vrtSnapshotMidRound,
  activePlayerId: null,
  roundStatus: "resolving_action",
  pendingAction: {
    sourcePlayerId: RILEY,
    actionKind: "freeze",
    eligibleTargetIds: [SAM, JORDAN],
    resume: "turns",
  },
  latestEvent: {
    type: "pending_action",
    payload: { actionKind: "freeze" },
    actorPlayerId: RILEY,
    targetPlayerId: null,
    playerNames: "Riley",
  },
};

/** Round scored — start next round. */
export const vrtSnapshotRoundComplete: MatchSnapshot = {
  ...vrtSnapshotMidRound,
  activePlayerId: null,
  roundStatus: "completed",
  endedBy: null,
  players: vrtSnapshotMidRound.players.map((p) =>
    p.playerId === RILEY
      ? {
          ...p,
          roundStatus: "completed" as const,
          pointsAtRisk: 0,
        }
      : p.playerId === SAM
        ? {
            ...p,
            roundStatus: "stayed" as const,
            pointsAtRisk: 18,
          }
        : p,
  ),
  latestEvent: {
    type: "flip7",
    payload: {},
    actorPlayerId: RILEY,
    targetPlayerId: RILEY,
    playerNames: "Riley",
  },
};

/** Viewer has seven unique numbers (flip 7). */
export const vrtSnapshotFlip7Hand: MatchSnapshot = {
  ...vrtSnapshotMidRound,
  activePlayerId: RILEY,
  roundStatus: "player_turns",
  players: [
    playerRow({
      playerId: RILEY,
      displayName: "Riley",
      seatIndex: 0,
      totalScore: 120,
      roundStatus: "active",
      pointsAtRisk: 45,
      modifierCards: [],
      numberCards: numbers([
        { label: "A", value: 1 },
        { label: "B", value: 2 },
        { label: "C", value: 3 },
        { label: "D", value: 4 },
        { label: "E", value: 5 },
        { label: "F", value: 6 },
        { label: "G", value: 7 },
      ]),
      heldActionCards: [],
    }),
    vrtSnapshotMidRound.players[1]!,
    playerRow({
      playerId: JORDAN,
      displayName: "Jordan",
      seatIndex: 2,
      totalScore: 30,
      roundStatus: "waiting",
      pointsAtRisk: 5,
      modifierCards: [],
      numberCards: numbers([{ label: "J1", value: 5 }]),
      heldActionCards: [],
    }),
  ],
  latestEvent: {
    type: "flip7",
    payload: {},
    actorPlayerId: RILEY,
    targetPlayerId: RILEY,
    playerNames: "Riley",
  },
};
