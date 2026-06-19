import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { CardValue } from "../card-value-schema";
import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    roundId: Id("rounds"),
    playerId: Id("players"),
    status: Schema.Literal("waiting", "active", "stayed", "busted", "frozen", "completed"),
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
