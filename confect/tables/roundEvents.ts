import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    roundId: Id("rounds"),
    sequence: Schema.Number,
    eventType: Schema.Literal(
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
    ),
    actorPlayerId: Schema.optional(Id("players")),
    targetPlayerId: Schema.optional(Id("players")),
    payload: Schema.Any,
    createdAt: Schema.Number,
  }),
).index("by_round", ["roundId"]);
