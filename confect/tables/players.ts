import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    matchId: Id("matches"),
    displayName: Schema.String,
    colorId: Schema.optional(Schema.String),
    seatIndex: Schema.Number,
    totalScore: Schema.Number,
    hasWon: Schema.Boolean,
  }),
).index("by_match", ["matchId"]);
