import { Table } from "@confect/server";
import * as Schema from "effect/Schema";

import { Id } from "../_generated/id";

export default Table.make(() =>
  Schema.Struct({
    sessionId: Schema.String,
    playerId: Id("players"),
  }),
)
  .index("by_session_id", ["sessionId"])
  .index("by_player_id", ["playerId"]);
