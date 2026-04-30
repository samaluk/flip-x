import type { SessionId } from "convex-helpers/server/sessions";
import { Effect } from "effect";

import type { Id } from "../../convex/_generated/dataModel";
import type { DatabaseReader } from "../_generated/services";
import { getPlayerIdForSessionWithReader } from "./session_store";

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

