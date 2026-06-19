import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    matchId: Id("matches"),
    idempotencyKey: Schema.String,
    commandType: Schema.Literal("START_MATCH", "START_NEXT_ROUND", "TAKE_TURN", "RESOLVE_ACTION"),
    commandResult: Schema.Any,
    expiresAt: Schema.Number,
    createdAt: Schema.Number,
  }),
)
  .index("by_idempotency_key", ["idempotencyKey"])
  .index("by_match", ["matchId"]);
