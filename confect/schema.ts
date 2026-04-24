import { GenericId } from "@confect/core";
import { DatabaseSchema, Table } from "@confect/server";
import { Schema } from "effect";

const ActionKind = Schema.Literal("flip_three", "freeze", "second_chance");
const PendingActionKind = Schema.Literal("flip_three", "freeze");
const RoundPhase = Schema.Literal(
  "dealing",
  "player_turns",
  "resolving_action",
  "scoring",
  "completed",
);
const MatchStatus = Schema.Literal("setup", "in_progress", "completed");
const RoundPlayerStatus = Schema.Literal(
  "waiting",
  "active",
  "stayed",
  "busted",
  "frozen",
  "completed",
);
const RoundEndReason = Schema.Literal("all_inactive", "flip7", "unknown");
const RoundEventType = Schema.Literal(
  "initial_deal",
  "hit",
  "flip3_hit",
  "number_drawn",
  "modifier_drawn",
  "second_chance_held",
  "second_chance_passed",
  "second_chance_discarded",
  "second_chance_used",
  "duplicate_bust",
  "flip7",
  "freeze_applied",
  "stay",
  "flip_three_targeted",
  "flip3_completed",
  "deferred_action",
  "pending_action",
  "round_scored",
);

const CardValue = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("number", "modifier", "action"),
  label: Schema.String,
  numberValue: Schema.optional(Schema.Number),
  modifierValue: Schema.optional(Schema.Union(Schema.Number, Schema.Literal("x2"))),
  actionKind: Schema.optional(ActionKind),
});

export const Matches = Table.make(
  "matches",
  Schema.Struct({
    status: MatchStatus,
    lobbyCode: Schema.String,
    hostPlayerId: Schema.optional(GenericId.GenericId("players")),
    targetScore: Schema.Number,
    currentRoundNumber: Schema.Number,
    dealerSeat: Schema.Number,
    winnerPlayerId: Schema.optional(GenericId.GenericId("players")),
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
  }),
).index("by_lobby_code", ["lobbyCode"]);

export const Players = Table.make(
  "players",
  Schema.Struct({
    matchId: GenericId.GenericId("matches"),
    displayName: Schema.String,
    colorId: Schema.optional(Schema.String),
    seatIndex: Schema.Number,
    totalScore: Schema.Number,
    hasWon: Schema.Boolean,
  }),
).index("by_match", ["matchId"]);

export const PlayerSessions = Table.make(
  "playerSessions",
  Schema.Struct({
    sessionId: Schema.String,
    playerId: GenericId.GenericId("players"),
  }),
)
  .index("by_session_id", ["sessionId"])
  .index("by_player_id", ["playerId"]);

export const Rounds = Table.make(
  "rounds",
  Schema.Struct({
    matchId: GenericId.GenericId("matches"),
    roundNumber: Schema.Number,
    phase: RoundPhase,
    dealerSeat: Schema.Number,
    activePlayerId: Schema.optional(GenericId.GenericId("players")),
    drawPile: Schema.Array(CardValue),
    discardPile: Schema.Array(CardValue),
    openingSeatIndex: Schema.Number,
    turnSeatIndex: Schema.Number,
    endedBy: RoundEndReason,
    pendingAction: Schema.optional(
      Schema.Struct({
        sourcePlayerId: GenericId.GenericId("players"),
        actionKind: PendingActionKind,
        eligibleTargetIds: Schema.Array(GenericId.GenericId("players")),
        resume: Schema.Literal("dealing", "turns"),
      }),
    ),
    pendingFlip3: Schema.optional(
      Schema.Struct({
        sourcePlayerId: GenericId.GenericId("players"),
        targetPlayerId: GenericId.GenericId("players"),
        cardsRemaining: Schema.Number,
        deferredActionCards: Schema.Array(CardValue),
      }),
    ),
    startedAt: Schema.Number,
    endedAt: Schema.optional(Schema.Number),
  }),
)
  .index("by_match", ["matchId"])
  .index("by_match_round", ["matchId", "roundNumber"]);

export const RoundPlayerStates = Table.make(
  "roundPlayerStates",
  Schema.Struct({
    roundId: GenericId.GenericId("rounds"),
    playerId: GenericId.GenericId("players"),
    status: RoundPlayerStatus,
    numberCards: Schema.Array(CardValue),
    modifierCards: Schema.Array(CardValue),
    heldActionCards: Schema.Array(CardValue),
    receivedActionCards: Schema.Array(CardValue),
    roundScore: Schema.Number,
    pointsAtRisk: Schema.Number,
    hasFlip7: Schema.Boolean,
    bustCard: Schema.optional(CardValue),
  }),
)
  .index("by_round", ["roundId"])
  .index("by_round_player", ["roundId", "playerId"]);

export const RoundEvents = Table.make(
  "roundEvents",
  Schema.Struct({
    roundId: GenericId.GenericId("rounds"),
    sequence: Schema.Number,
    eventType: RoundEventType,
    actorPlayerId: Schema.optional(GenericId.GenericId("players")),
    targetPlayerId: Schema.optional(GenericId.GenericId("players")),
    payload: Schema.Any,
    createdAt: Schema.Number,
  }),
).index("by_round", ["roundId"]);

export const ScoreBreakdowns = Table.make(
  "scoreBreakdowns",
  Schema.Struct({
    roundId: GenericId.GenericId("rounds"),
    playerId: GenericId.GenericId("players"),
    numberCardTotal: Schema.Number,
    multiplierApplied: Schema.Boolean,
    multipliedTotal: Schema.Number,
    additiveModifierTotal: Schema.Number,
    flip7Bonus: Schema.Number,
    finalRoundScore: Schema.Number,
  }),
)
  .index("by_round", ["roundId"])
  .index("by_round_player", ["roundId", "playerId"]);

export default DatabaseSchema.make()
  .addTable(Matches)
  .addTable(Players)
  .addTable(PlayerSessions)
  .addTable(Rounds)
  .addTable(RoundPlayerStates)
  .addTable(RoundEvents)
  .addTable(ScoreBreakdowns);
