import type { SessionId } from "convex-helpers/server/sessions";
import { Effect } from "effect";

import type { Card } from "../game/logic/card-types";
import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { runGameCommandEffect } from "../game/application/run-command";

export async function startNextRoundForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  return await Effect.runPromise(startNextRoundForSessionEffect(ctx, args));
}

export function startNextRoundForSessionEffect(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  const sessionId = args.sessionId as SessionId;
  return runGameCommandEffect(ctx, {
    matchId: args.matchId,
    sessionId,
    command: {
      type: "START_NEXT_ROUND",
      expectedVersion: args.expectedVersion,
      idempotencyKey: args.idempotencyKey,
      deterministicStart: args.deterministicStart,
    },
  });
}
