import { Schema } from "effect";

const ActionKind = Schema.Literal("flip_three", "freeze", "second_chance");
const PendingActionKind = Schema.Literal("flip_three", "freeze");

const ActionCardSummary = Schema.Struct({
  label: Schema.String,
  actionKind: ActionKind,
});

const NumberCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("number"),
  label: Schema.String,
  numberValue: Schema.Number,
});

const ModifierCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("modifier"),
  label: Schema.String,
  modifierValue: Schema.Union(
    Schema.Literal(2),
    Schema.Literal(4),
    Schema.Literal(6),
    Schema.Literal(8),
    Schema.Literal(10),
    Schema.Literal("x2"),
  ),
});

const ScoreBreakdown = Schema.Struct({
  numberCardTotal: Schema.Number,
  multiplierApplied: Schema.Boolean,
  multipliedTotal: Schema.Number,
  additiveModifierTotal: Schema.Number,
  flip7Bonus: Schema.Number,
  finalRoundScore: Schema.Number,
});

const PendingAction = Schema.Struct({
  sourcePlayerId: Schema.String,
  actionKind: PendingActionKind,
  eligibleTargetIds: Schema.Array(Schema.String),
  resume: Schema.Literal("dealing", "turns"),
});

const PendingFlip3 = Schema.Struct({
  sourcePlayerId: Schema.String,
  targetPlayerId: Schema.String,
  cardsRemaining: Schema.Number,
  deferredActionCards: Schema.Array(ActionCardSummary),
});

const PlayerSnapshot = Schema.Struct({
  playerId: Schema.String,
  displayName: Schema.String,
  seatIndex: Schema.Number,
  totalScore: Schema.Number,
  isOnline: Schema.Boolean,
  roundStatus: Schema.Literal("waiting", "active", "stayed", "busted", "frozen", "completed"),
  pointsAtRisk: Schema.Number,
  numberCards: Schema.Array(NumberCard),
  modifierCards: Schema.Array(ModifierCard),
  heldActionCards: Schema.Array(ActionCardSummary),
  receivedActionCards: Schema.Array(ActionCardSummary),
  scoreBreakdown: ScoreBreakdown,
  bustCard: Schema.NullOr(NumberCard),
});

const LatestEvent = Schema.Struct({
  type: Schema.String,
  payload: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  actorPlayerId: Schema.optional(Schema.NullOr(Schema.String)),
  targetPlayerId: Schema.optional(Schema.NullOr(Schema.String)),
  playerNames: Schema.optional(Schema.String),
});

export const CanonicalReplayStepState = Schema.Struct({
  status: Schema.Literal("setup", "in_progress", "completed"),
  currentRoundNumber: Schema.Number,
  dealerSeat: Schema.Number,
  activePlayerId: Schema.NullOr(Schema.String),
  pendingAction: Schema.NullOr(PendingAction),
  pendingFlip3: Schema.NullOr(PendingFlip3),
  roundStatus: Schema.NullOr(
    Schema.Literal("dealing", "player_turns", "resolving_action", "scoring", "completed"),
  ),
  endedBy: Schema.NullOr(Schema.Literal("all_inactive", "flip7", "unknown")),
  players: Schema.Array(PlayerSnapshot),
  latestEvent: Schema.NullOr(LatestEvent),
});

const RoundHistoryEntry = Schema.Struct({
  roundNumber: Schema.Number,
  phase: Schema.Literal("completed", "projected"),
  isCurrentRound: Schema.Boolean,
  scores: Schema.Array(
    Schema.Struct({
      playerId: Schema.String,
      roundScore: Schema.Number,
      totalScore: Schema.Number,
      pointsToTarget: Schema.Number,
      reachedTarget: Schema.Boolean,
    }),
  ),
});

export const MatchSnapshot = Schema.Struct({
  matchId: Schema.String,
  lobbyCode: Schema.optional(Schema.String),
  isHost: Schema.optional(Schema.Boolean),
  status: Schema.Literal("setup", "in_progress", "completed"),
  targetScore: Schema.Number,
  currentRoundNumber: Schema.Number,
  dealerSeat: Schema.Number,
  viewerPlayerId: Schema.NullOr(Schema.String),
  activePlayerId: Schema.NullOr(Schema.String),
  pendingAction: Schema.NullOr(PendingAction),
  pendingFlip3: Schema.NullOr(PendingFlip3),
  roundStatus: Schema.NullOr(
    Schema.Literal("dealing", "player_turns", "resolving_action", "scoring", "completed"),
  ),
  endedBy: Schema.NullOr(Schema.Literal("all_inactive", "flip7", "unknown")),
  players: Schema.Array(PlayerSnapshot),
  latestEvent: Schema.NullOr(LatestEvent),
  roundHistory: Schema.Array(RoundHistoryEntry),
});
