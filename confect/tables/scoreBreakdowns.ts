import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    roundId: Id("rounds"),
    playerId: Id("players"),
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
