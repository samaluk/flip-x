import type { SessionId } from "convex-helpers/server/sessions";
import { getOneFrom } from "convex-helpers/server/relationships";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

import type { Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import {
  DatabaseReader as DatabaseReaderService,
  DatabaseWriter as DatabaseWriterService,
} from "../_generated/services";

type DatabaseReader = Effect.Effect.Success<typeof DatabaseReaderService>;
type DatabaseWriter = Effect.Effect.Success<typeof DatabaseWriterService>;

type Ctx = QueryCtx | MutationCtx;

function getPlayerSessionBySessionId(reader: DatabaseReader, sessionId: SessionId) {
  return reader
    .table("playerSessions")
    .index("by_session_id", (query) => query.eq("sessionId", sessionId))
    .first()
    .pipe(Effect.map(Option.getOrNull));
}

export function getPlayerIdForSessionWithReader(reader: DatabaseReader, sessionId?: SessionId) {
  return Effect.gen(function* () {
    if (!sessionId) {
      return null;
    }

    const playerSession = yield* getPlayerSessionBySessionId(reader, sessionId);

    return playerSession?.playerId ?? null;
  });
}

export function getPlayerIdForSession(ctx: Ctx, sessionId?: SessionId) {
  return Effect.gen(function* () {
    if (!sessionId) {
      return null;
    }

    const playerSession = yield* Effect.promise(() =>
      getOneFrom(ctx.db, "playerSessions", "by_session_id", sessionId, "sessionId"),
    );

    return playerSession?.playerId ?? null;
  });
}

export function setPlayerSessionWithServices(
  reader: DatabaseReader,
  writer: DatabaseWriter,
  sessionId: SessionId,
  playerId: Id<"players">,
) {
  return Effect.gen(function* () {
    const existing = yield* getPlayerSessionBySessionId(reader, sessionId);

    if (existing) {
      yield* writer.table("playerSessions").patch(existing._id, { playerId });
      return;
    }

    yield* writer.table("playerSessions").insert({ sessionId, playerId });
  });
}
