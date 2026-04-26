import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { MutationCtx } from "./_generated/services";
import * as turnFns from "./turns";

const takeTurn = FunctionImpl.make(api, "turns", "takeTurn", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof turnFns.takeTurnForSessionEffect
    >[0];
    return yield* turnFns.takeTurnForSessionEffect(ctx, {
      ...args,
      matchId: args.matchId as Parameters<typeof turnFns.takeTurnForSessionEffect>[1]["matchId"],
    });
  }).pipe(Effect.orDie),
);
const resolveAction = FunctionImpl.make(api, "turns", "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof turnFns.resolveActionForSessionEffect
    >[0];
    return yield* turnFns.resolveActionForSessionEffect(ctx, {
      ...args,
      matchId: args.matchId as Parameters<typeof turnFns.resolveActionForSessionEffect>[1]["matchId"],
      targetPlayerId: args.targetPlayerId as Parameters<
        typeof turnFns.resolveActionForSessionEffect
      >[1]["targetPlayerId"],
    });
  }).pipe(Effect.orDie),
);

export const turns = GroupImpl.make(api, "turns").pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
);
