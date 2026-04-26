import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import type { Card } from "../game/logic/card-types";

import api from "./_generated/api";
import { MutationCtx } from "./_generated/services";
import * as roundFns from "./rounds";

function normalizeDeterministicStart(
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

const startNextRound = FunctionImpl.make(api, "rounds", "startNextRound", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof roundFns.startNextRoundForSessionEffect
    >[0];
    return yield* roundFns.startNextRoundForSessionEffect(ctx, {
      ...args,
      matchId: args.matchId as Parameters<typeof roundFns.startNextRoundForSessionEffect>[1]["matchId"],
      deterministicStart: normalizeDeterministicStart(args.deterministicStart),
    });
  }).pipe(Effect.orDie),
);

export const rounds = GroupImpl.make(api, "rounds").pipe(Layer.provide(startNextRound));
