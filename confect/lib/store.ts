import type { SessionId } from "convex-helpers/server/sessions";
import { getManyFrom } from "convex-helpers/server/relationships";

import type { Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import { getPlayerIdForSession } from "./session_store";
import { PlayerNotJoined } from "../../shared/lib/errors/domain";

type Ctx = QueryCtx | MutationCtx;

export async function getPlayersByMatch(ctx: Ctx, matchId: Id<"matches">) {
  return await getManyFrom(ctx.db, "players", "by_match", matchId, "matchId");
}

export async function getViewerPlayerId(ctx: Ctx, matchId: Id<"matches">, sessionId?: SessionId) {
  const playerId = await getPlayerIdForSession(ctx, sessionId);

  if (!playerId) {
    return null;
  }

  const player = await ctx.db.get(playerId);
  return player?.matchId === matchId ? player._id : null;
}

export async function requireViewerPlayerId(
  ctx: Ctx,
  matchId: Id<"matches">,
  sessionId: SessionId,
) {
  const playerId = await getViewerPlayerId(ctx, matchId, sessionId);

  if (!playerId) {
    throw new PlayerNotJoined();
  }

  return playerId;
}
