import type { SessionId } from "convex-helpers/server/sessions";
import { getOneFrom } from "convex-helpers/server/relationships";
import { Effect } from "effect";

import type { Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function getPlayerIdForSession(
  ctx: Ctx,
  sessionId?: SessionId,
): Promise<Id<"players"> | null> {
  return await Effect.runPromise(getPlayerIdForSessionEffect(ctx, sessionId));
}

export function getPlayerIdForSessionEffect(ctx: Ctx, sessionId?: SessionId) {
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

export async function setPlayerSession(
  ctx: MutationCtx,
  sessionId: SessionId,
  playerId: Id<"players">,
) {
  return await Effect.runPromise(setPlayerSessionEffect(ctx, sessionId, playerId));
}

export function setPlayerSessionEffect(
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
