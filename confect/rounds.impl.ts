import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { MutationCtx } from "./_generated/services";
import * as roundFns from "./rounds";

const startNextRound = FunctionImpl.make(api, "rounds", "startNextRound", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* roundFns.startNextRoundForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
      deterministicStart: args.deterministicStart
        ? { roundSeed: { drawPile: [...args.deterministicStart.roundSeed.drawPile] } }
        : undefined,
    });
  }).pipe(Effect.orDie),
);

export const rounds = GroupImpl.make(api, "rounds").pipe(Layer.provide(startNextRound));
