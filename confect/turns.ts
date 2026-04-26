import type { SessionId } from "convex-helpers/server/sessions";
import { Effect } from "effect";

import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { runGameCommandEffect } from "../game/application/run-command";

export async function takeTurnForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    action: "hit" | "stay";
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
  },
) {
  return await Effect.runPromise(takeTurnForSessionEffect(ctx, args));
}

export function takeTurnForSessionEffect(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    action: "hit" | "stay";
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
  },
) {
  const sessionId = args.sessionId as SessionId;
  return runGameCommandEffect(ctx, {
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

export async function resolveActionForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    targetPlayerId: Id<"players">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
  },
) {
  return await Effect.runPromise(resolveActionForSessionEffect(ctx, args));
}

export function resolveActionForSessionEffect(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    targetPlayerId: Id<"players">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
  },
) {
  const sessionId = args.sessionId as SessionId;
  return runGameCommandEffect(ctx, {
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
