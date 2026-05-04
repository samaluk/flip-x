import { v } from "convex/values";
import { Effect } from "effect";

import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Card } from "../game/logic/card-types";
import { runGameCommand } from "../game/application/run-command";
import { buildCurrentMatchSnapshotForViewer } from "../game/infrastructure/snapshot-store";
import { enforceRateLimit } from "./lib/rate_limiter";
import { queryWithSession, toSessionId } from "./lib/session_functions";

export const getMatchSnapshot = queryWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => await Effect.runPromise(loadMatchSnapshotForSession(ctx, args)),
});

function loadMatchSnapshotForSession(
  ctx: QueryCtx,
  args: { matchId: Id<"matches">; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    return yield* Effect.promise(() =>
      buildCurrentMatchSnapshotForViewer(ctx, args.matchId, sessionId),
    );
  });
}

export function startMatchForSession(
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

  return Effect.gen(function* () {
    yield* enforceRateLimit(ctx, "startMatch", args.sessionId);

    return yield* runGameCommand(ctx, {
      matchId: args.matchId,
      sessionId,
      command: {
        type: "START_MATCH",
        expectedVersion: args.expectedVersion,
        idempotencyKey: args.idempotencyKey,
        deterministicStart: args.deterministicStart,
      },
    });
  });
}
