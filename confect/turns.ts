import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { runGameCommand } from "../game/application/run-command";
import { toSessionId } from "./lib/session_functions";

export function takeTurnForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    action: "hit" | "stay";
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
  },
) {
  const sessionId = toSessionId(args.sessionId);
  return runGameCommand(ctx, {
    matchId: args.matchId,
    sessionId,
    command: {
      type: "TAKE_TURN",
      expectedVersion: args.expectedVersion,
      idempotencyKey: args.idempotencyKey,
      action: args.action,
    },
  });
}

export function resolveActionForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    targetPlayerId: Id<"players">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
  },
) {
  const sessionId = toSessionId(args.sessionId);
  return runGameCommand(ctx, {
    matchId: args.matchId,
    sessionId,
    command: {
      type: "RESOLVE_ACTION",
      expectedVersion: args.expectedVersion,
      idempotencyKey: args.idempotencyKey,
      targetPlayerId: args.targetPlayerId,
    },
  });
}
