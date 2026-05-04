import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { MutationCtx } from "./_generated/services";
import { matchIdFromConfectWire } from "./lib/convex-id-bridge";
import { cloneDeterministicStart } from "./lib/deterministic_start";
import * as roundFns from "./rounds";

const startNextRound = FunctionImpl.make(api, "rounds", "startNextRound", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* roundFns.startNextRoundForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
      deterministicStart: cloneDeterministicStart(args.deterministicStart),
    });
  }).pipe(Effect.orDie),
);

export const rounds = GroupImpl.make(api, "rounds").pipe(Layer.provide(startNextRound));
