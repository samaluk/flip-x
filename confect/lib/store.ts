import type { SessionId } from "convex-helpers/server/sessions";
import { getManyFrom } from "convex-helpers/server/relationships";
import { Effect } from "effect";

import type { Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import { getPlayerIdForSession } from "./session_store";

type Ctx = QueryCtx | MutationCtx;

export function getPlayersByMatch(ctx: Ctx, matchId: Id<"matches">) {
  return Effect.promise(() => getManyFrom(ctx.db, "players", "by_match", matchId, "matchId"));
}

export function getViewerPlayerId(ctx: Ctx, matchId: Id<"matches">, sessionId?: SessionId) {
  return Effect.gen(function* () {
    const playerId = yield* getPlayerIdForSession(ctx, sessionId);

    if (!playerId) {
      return null;
    }

    const player = yield* Effect.promise(() => ctx.db.get(playerId));
    return player?.matchId === matchId ? player._id : null;
  });
}
