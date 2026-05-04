import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { MutationCtx } from "./_generated/services";
import { matchIdFromConfectWire, playerIdFromConfectWire } from "./lib/convex-id-bridge";
import * as turnFns from "./turns";

const takeTurn = FunctionImpl.make(api, "turns", "takeTurn", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.takeTurnForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
    });
  }).pipe(Effect.orDie),
);
const resolveAction = FunctionImpl.make(api, "turns", "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.resolveActionForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
      targetPlayerId: playerIdFromConfectWire(args.targetPlayerId),
    });
  }).pipe(Effect.orDie),
);

export const turns = GroupImpl.make(api, "turns").pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
);
