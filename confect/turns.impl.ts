import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { retainAppErrors } from "../shared/lib/errors/domain";
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
  }).pipe(retainAppErrors),
);
const resolveAction = FunctionImpl.make(databaseSchema, groupSpec, "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.resolveActionForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
      targetPlayerId: playerIdFromConfectWire(args.targetPlayerId),
    });
  }).pipe(retainAppErrors),
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
  GroupImpl.finalize,
);
