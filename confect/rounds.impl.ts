import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { asConfectCtx, asMatchId, getMutationCtx, normalizeDeterministicStart } from "./lib/ctx";
import * as roundFns from "./rounds";

const startNextRound = FunctionImpl.make(api, "rounds", "startNextRound", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof roundFns.startNextRoundForSession>[0]>(
      yield* getMutationCtx(),
    );
    return yield* roundFns.startNextRoundForSession(ctx, {
      ...args,
      matchId: asMatchId<
        Parameters<typeof roundFns.startNextRoundForSession>[1]["matchId"]
      >(args.matchId),
      deterministicStart: normalizeDeterministicStart(args.deterministicStart),
    });
  }).pipe(Effect.orDie),
);

export const rounds = GroupImpl.make(api, "rounds").pipe(Layer.provide(startNextRound));
