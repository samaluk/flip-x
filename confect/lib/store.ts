import type { SessionId } from "convex-helpers/server/sessions";
import * as Effect from "effect/Effect";

import type { Id } from "../../convex/_generated/dataModel";
import { DatabaseReader as DatabaseReaderService } from "../_generated/services";
import { getPlayerIdForSessionWithReader } from "./session_store";

type DatabaseReader = Effect.Effect.Success<typeof DatabaseReaderService>;

export function getPlayersByMatchWithReader(reader: DatabaseReader, matchId: Id<"matches">) {
  return reader
    .table("players")
    .index("by_match", (query) => query.eq("matchId", matchId))
    .collect();
}

export function getViewerPlayerIdWithReader(
  reader: DatabaseReader,
  matchId: Id<"matches">,
  sessionId?: SessionId,
) {
  return Effect.gen(function* () {
    const playerId = yield* getPlayerIdForSessionWithReader(reader, sessionId);

    if (!playerId) {
      return null;
    }

    const player = yield* reader.table("players").get(playerId);
    return player?.matchId === matchId ? player._id : null;
  });
}
