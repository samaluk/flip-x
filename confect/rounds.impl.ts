import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import databaseSchema from "./_generated/schema";
import groupSpec from "./rounds.spec";
import { MutationCtx } from "./_generated/services";
import { matchIdFromConfectWire } from "./lib/convex-id-bridge";
import { cloneDeterministicStart } from "./lib/deterministic_start";
import * as roundFns from "./rounds";

const startNextRound = FunctionImpl.make(databaseSchema, groupSpec, "startNextRound", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* roundFns.startNextRoundForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
      deterministicStart: cloneDeterministicStart(args.deterministicStart),
    });
  }).pipe(Effect.orDie),
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(startNextRound),
  GroupImpl.finalize,
);
