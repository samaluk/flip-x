import type { SessionId } from "convex-helpers/server/sessions";
import { getManyFrom } from "convex-helpers/server/relationships";
import { Effect } from "effect";

import type { Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import { getPlayerIdForSessionEffect } from "./session_store";
import { PlayerNotJoined } from "../../shared/lib/errors/domain";

type Ctx = QueryCtx | MutationCtx;

export async function getPlayersByMatch(ctx: Ctx, matchId: Id<"matches">) {
  return await Effect.runPromise(getPlayersByMatchEffect(ctx, matchId));
}

export function getPlayersByMatchEffect(ctx: Ctx, matchId: Id<"matches">) {
  return Effect.promise(() => getManyFrom(ctx.db, "players", "by_match", matchId, "matchId"));
}

export async function getViewerPlayerId(ctx: Ctx, matchId: Id<"matches">, sessionId?: SessionId) {
  return await Effect.runPromise(getViewerPlayerIdEffect(ctx, matchId, sessionId));
}

export function getViewerPlayerIdEffect(ctx: Ctx, matchId: Id<"matches">, sessionId?: SessionId) {
  return Effect.gen(function* () {
    const playerId = yield* getPlayerIdForSessionEffect(ctx, sessionId);

    if (!playerId) {
      return null;
    }

    const player = yield* Effect.promise(() => ctx.db.get(playerId));
    return player?.matchId === matchId ? player._id : null;
  });
}

export async function requireViewerPlayerId(
  ctx: Ctx,
  matchId: Id<"matches">,
  sessionId: SessionId,
) {
  return await Effect.runPromise(requireViewerPlayerIdEffect(ctx, matchId, sessionId));
}

export function requireViewerPlayerIdEffect(ctx: Ctx, matchId: Id<"matches">, sessionId: SessionId) {
  return Effect.gen(function* () {
    const playerId = yield* getViewerPlayerIdEffect(ctx, matchId, sessionId);

    if (!playerId) {
      return yield* new PlayerNotJoined();
    }

    return playerId;
  });
}
