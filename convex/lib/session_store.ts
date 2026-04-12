import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";

type Ctx = QueryCtx | MutationCtx;

export async function getPlayerIdForSession(
  ctx: Ctx,
  sessionId?: SessionId,
): Promise<Id<"players"> | null> {
  if (!sessionId) {
    return null;
  }

  const playerSession = await ctx.db
    .query("playerSessions")
    .withIndex("by_session_id", (query) => query.eq("sessionId", sessionId))
    .unique();

  return playerSession?.playerId ?? null;
}

export async function setPlayerSession(
  ctx: MutationCtx,
  sessionId: SessionId,
  playerId: Id<"players">,
) {
  const existing = await ctx.db
    .query("playerSessions")
    .withIndex("by_session_id", (query) => query.eq("sessionId", sessionId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { playerId });
    return;
  }

  await ctx.db.insert("playerSessions", {
    sessionId,
    playerId,
  });
}
