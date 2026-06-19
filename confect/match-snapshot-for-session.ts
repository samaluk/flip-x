import type { SessionId } from "convex-helpers/server/sessions";
import * as Effect from "effect/Effect";

import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { buildCurrentMatchSnapshotForViewer } from "../game/infrastructure/snapshot-store";
import { matchNotFound } from "../shared/lib/errors/domain";

export type MatchReadCtx = QueryCtx | MutationCtx;

export function snapshotForMatchSession(
  ctx: MatchReadCtx,
  matchId: Id<"matches">,
  sessionId: SessionId,
) {
  return Effect.gen(function* () {
    const snapshot = yield* Effect.promise(() =>
      buildCurrentMatchSnapshotForViewer(ctx, matchId, sessionId),
    );

    if (!snapshot) {
      return yield* matchNotFound({ matchId: String(matchId) });
    }

    return snapshot;
  });
}
