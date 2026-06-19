import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import databaseSchema from "./_generated/schema";
import groupSpec from "./turns.spec";
import { MutationCtx } from "./_generated/services";
import { matchIdFromConfectWire, playerIdFromConfectWire } from "./lib/convex-id-bridge";
import * as turnFns from "./turns";

const takeTurn = FunctionImpl.make(databaseSchema, groupSpec, "takeTurn", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.takeTurnForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
    });
  }).pipe(Effect.orDie),
);
const resolveAction = FunctionImpl.make(databaseSchema, groupSpec, "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.resolveActionForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
      targetPlayerId: playerIdFromConfectWire(args.targetPlayerId),
    });
  }).pipe(Effect.orDie),
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
  GroupImpl.finalize,
);
