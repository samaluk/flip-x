import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";

const cardValue = v.object({
  id: v.string(),
  type: v.union(v.literal("number"), v.literal("modifier"), v.literal("action")),
  label: v.string(),
  numberValue: v.optional(v.number()),
  modifierValue: v.optional(v.union(v.number(), v.literal("x2"))),
  actionKind: v.optional(
    v.union(v.literal("flip_three"), v.literal("freeze"), v.literal("second_chance")),
  ),
});

export default defineSchema({
  matches: defineTable({
    status: v.union(v.literal("setup"), v.literal("in_progress"), v.literal("completed")),
    lobbyCode: v.string(),
    hostPlayerId: v.optional(v.id("players")),
    targetScore: v.number(),
    currentRoundNumber: v.number(),
    dealerSeat: v.number(),
    winnerPlayerId: v.optional(v.id("players")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_lobby_code", ["lobbyCode"]),
  players: defineTable({
    matchId: v.id("matches"),
    displayName: v.string(),
    seatIndex: v.number(),
    totalScore: v.number(),
    hasWon: v.boolean(),
  }).index("by_match", ["matchId"]),
  playerSessions: defineTable({
    sessionId: vSessionId,
    playerId: v.id("players"),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_player_id", ["playerId"]),
  rounds: defineTable({
    matchId: v.id("matches"),
    roundNumber: v.number(),
    phase: v.union(
      v.literal("dealing"),
      v.literal("player_turns"),
      v.literal("resolving_action"),
      v.literal("scoring"),
      v.literal("completed"),
    ),
    dealerSeat: v.number(),
    activePlayerId: v.optional(v.id("players")),
    drawPile: v.array(cardValue),
    discardPile: v.array(cardValue),
    openingSeatIndex: v.number(),
    turnSeatIndex: v.number(),
    endedBy: v.union(v.literal("all_inactive"), v.literal("flip7"), v.literal("unknown")),
    pendingAction: v.optional(
      v.object({
        sourcePlayerId: v.id("players"),
        actionKind: v.union(v.literal("flip_three"), v.literal("freeze")),
        eligibleTargetIds: v.array(v.id("players")),
        resume: v.union(v.literal("dealing"), v.literal("turns")),
      }),
    ),
    pendingFlip3: v.optional(
      v.object({
        sourcePlayerId: v.id("players"),
        targetPlayerId: v.id("players"),
        cardsRemaining: v.number(),
        deferredActionCards: v.array(cardValue),
      }),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_match", ["matchId"])
    .index("by_match_round", ["matchId", "roundNumber"]),
  roundPlayerStates: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("stayed"),
      v.literal("busted"),
      v.literal("frozen"),
      v.literal("completed"),
    ),
    numberCards: v.array(cardValue),
    modifierCards: v.array(cardValue),
    heldActionCards: v.array(cardValue),
    receivedActionCards: v.array(cardValue),
    roundScore: v.number(),
    pointsAtRisk: v.number(),
    hasFlip7: v.boolean(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_player", ["roundId", "playerId"]),
  roundEvents: defineTable({
    roundId: v.id("rounds"),
    sequence: v.number(),
    eventType: v.string(),
    actorPlayerId: v.optional(v.id("players")),
    targetPlayerId: v.optional(v.id("players")),
    payload: v.any(),
    createdAt: v.number(),
  }).index("by_round", ["roundId"]),
  scoreBreakdowns: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("players"),
    numberCardTotal: v.number(),
    multiplierApplied: v.boolean(),
    multipliedTotal: v.number(),
    additiveModifierTotal: v.number(),
    flip7Bonus: v.number(),
    finalRoundScore: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_player", ["roundId", "playerId"]),
});
