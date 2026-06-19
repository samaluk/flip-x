import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { CardValue } from "../card-value-schema";
import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    matchId: Id("matches"),
    roundNumber: Schema.Number,
    phase: Schema.Literal("dealing", "player_turns", "resolving_action", "scoring", "completed"),
    dealerSeat: Schema.Number,
    activePlayerId: Schema.optional(Id("players")),
    drawPile: Schema.Array(CardValue),
    discardPile: Schema.Array(CardValue),
    openingSeatIndex: Schema.Number,
    turnSeatIndex: Schema.Number,
    endedBy: Schema.Literal("all_inactive", "flip7", "unknown"),
    pendingAction: Schema.optional(
      Schema.Struct({
        sourcePlayerId: Id("players"),
        actionKind: Schema.Literal("flip_three", "freeze"),
        eligibleTargetIds: Schema.Array(Id("players")),
        resume: Schema.Literal("dealing", "turns"),
      }),
    ),
    pendingFlip3: Schema.optional(
      Schema.Struct({
        sourcePlayerId: Id("players"),
        targetPlayerId: Id("players"),
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
