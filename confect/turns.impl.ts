import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { MutationCtx } from "./_generated/services";
import * as turnFns from "./turns";

const takeTurn = FunctionImpl.make(api, "turns", "takeTurn", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.takeTurnForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
    });
  }).pipe(Effect.orDie),
);
const resolveAction = FunctionImpl.make(api, "turns", "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* turnFns.resolveActionForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
      targetPlayerId: args.targetPlayerId as Id<"players">,
    });
  }).pipe(Effect.orDie),
);

export const turns = GroupImpl.make(api, "turns").pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
);
