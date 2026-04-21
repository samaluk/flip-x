import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { MutationCtx } from "./_generated/services";
import * as roundFns from "./rounds";

const startNextRound = FunctionImpl.make(api, "rounds", "startNextRound", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof roundFns.startNextRoundForSession
    >[0];
    return yield* Effect.promise(() =>
      roundFns.startNextRoundForSession(ctx, {
        ...args,
        matchId: args.matchId as Parameters<typeof roundFns.startNextRoundForSession>[1]["matchId"],
      }),
    );
  }).pipe(Effect.orDie),
);

export const rounds = GroupImpl.make(api, "rounds").pipe(Layer.provide(startNextRound));
