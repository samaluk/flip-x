import type { SessionId } from "convex-helpers/server/sessions";
import { getOneFrom } from "convex-helpers/server/relationships";

import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function getPlayerIdForSession(
  ctx: Ctx,
  sessionId?: SessionId,
): Promise<Id<"players"> | null> {
  if (!sessionId) {
    return null;
  }

  const playerSession = await getOneFrom(
    ctx.db,
    "playerSessions",
    "by_session_id",
    sessionId,
    "sessionId",
  );

  return playerSession?.playerId ?? null;
}

export async function setPlayerSession(
  ctx: MutationCtx,
  sessionId: SessionId,
  playerId: Id<"players">,
) {
  const existing = await getOneFrom(
    ctx.db,
    "playerSessions",
    "by_session_id",
    sessionId,
    "sessionId",
  );

  if (existing) {
    await ctx.db.patch(existing._id, { playerId });
    return;
  }

  await ctx.db.insert("playerSessions", {
    sessionId,
    playerId,
  });
}
