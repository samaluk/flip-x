import type { SessionId } from "convex-helpers/server/sessions";
import { getOneFrom } from "convex-helpers/server/relationships";
import { Effect, Option } from "effect";

import type { Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import type { DatabaseReader, DatabaseWriter } from "../_generated/services";

type Ctx = QueryCtx | MutationCtx;

export function getPlayerIdForSessionWithReader(
  reader: DatabaseReader,
  sessionId?: SessionId,
) {
  return Effect.gen(function* () {
    if (!sessionId) {
      return null;
    }

    const playerSession = yield* reader
      .table("playerSessions")
      .index("by_session_id", (query) => query.eq("sessionId", sessionId))
      .first()
      .pipe(Effect.map(Option.getOrNull));

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
    const existing = yield* reader
      .table("playerSessions")
      .index("by_session_id", (query) => query.eq("sessionId", sessionId))
      .first()
      .pipe(Effect.map(Option.getOrNull));

    if (existing) {
      yield* writer.table("playerSessions").patch(existing._id, { playerId });
      return;
    }

    yield* writer.table("playerSessions").insert({ sessionId, playerId });
  });
}

export function setPlayerSession(
  ctx: MutationCtx,
  sessionId: SessionId,
  playerId: Id<"players">,
) {
  return Effect.gen(function* () {
    const existing = yield* Effect.promise(() =>
      getOneFrom(ctx.db, "playerSessions", "by_session_id", sessionId, "sessionId"),
    );

    if (existing) {
      yield* Effect.promise(() => ctx.db.patch(existing._id, { playerId }));
      return;
    }

    yield* Effect.promise(() =>
      ctx.db.insert("playerSessions", {
        sessionId,
        playerId,
      }),
    );
  });
}
