import type { SessionId } from "convex-helpers/server/sessions";

import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { runGameCommand } from "../game/application/run-command";

export async function takeTurnForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; action: "hit" | "stay"; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;
  return await runGameCommand(ctx, {
    matchId: args.matchId,
    sessionId,
    command: {
      type: "TAKE_TURN",
      action: args.action,
    },
  });
}

export async function resolveActionForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; targetPlayerId: Id<"players">; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;
  return await runGameCommand(ctx, {
    matchId: args.matchId,
    sessionId,
    command: {
      type: "RESOLVE_ACTION",
      targetPlayerId: args.targetPlayerId,
    },
  });
}
