import type { Card } from "../game/logic/card-types";
import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { runGameCommand } from "../game/application/run-command";
import { toSessionId } from "./lib/session_functions";

export function startNextRoundForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  const sessionId = toSessionId(args.sessionId);
  return runGameCommand(ctx, {
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
