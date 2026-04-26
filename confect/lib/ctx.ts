import type { Card } from "../../game/logic/card-types";
import { MutationCtx, QueryCtx } from "../_generated/services";

// Narrow Convex/Confect boundary shim: callers should keep casts here rather than
// repeating raw generated-service assertions in group impl files.
export function getMutationCtx() {
  return MutationCtx;
}

export function getQueryCtx() {
  return QueryCtx;
}

export function asConfectCtx<T>(ctx: unknown): T {
  return ctx as T;
}

export function asMatchId<T>(matchId: unknown): T {
  return matchId as T;
}

export function asPlayerId<T>(playerId: unknown): T {
  return playerId as T;
}

export function normalizeDeterministicStart(
  deterministicStart: { readonly roundSeed: { readonly drawPile: readonly Card[] } } | undefined,
) {
  if (!deterministicStart) {
    return undefined;
  }

  return {
    roundSeed: {
      drawPile: [...deterministicStart.roundSeed.drawPile],
    },
  };
}
