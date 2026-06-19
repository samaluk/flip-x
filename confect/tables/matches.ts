import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    status: Schema.Literal("setup", "in_progress", "completed"),
    lobbyCode: Schema.String,
    hostPlayerId: Schema.optional(Id("players")),
    targetScore: Schema.Number,
    maxNumberCardValue: Schema.optional(Schema.Number),
    currentRoundNumber: Schema.Number,
    dealerSeat: Schema.Number,
    version: Schema.Number,
    winnerPlayerId: Schema.optional(Id("players")),
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
  }),
).index("by_lobby_code", ["lobbyCode"]);
