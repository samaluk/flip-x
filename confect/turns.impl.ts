import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { asConfectCtx, asMatchId, asPlayerId, getMutationCtx } from "./lib/ctx";
import * as turnFns from "./turns";

const takeTurn = FunctionImpl.make(api, "turns", "takeTurn", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof turnFns.takeTurnForSessionEffect>[0]>(
      yield* getMutationCtx(),
    );
    return yield* turnFns.takeTurnForSessionEffect(ctx, {
      ...args,
      matchId: asMatchId<Parameters<typeof turnFns.takeTurnForSessionEffect>[1]["matchId"]>(
        args.matchId,
      ),
    });
  }).pipe(Effect.orDie),
);
const resolveAction = FunctionImpl.make(api, "turns", "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof turnFns.resolveActionForSessionEffect>[0]>(
      yield* getMutationCtx(),
    );
    return yield* turnFns.resolveActionForSessionEffect(ctx, {
      ...args,
      matchId: asMatchId<Parameters<typeof turnFns.resolveActionForSessionEffect>[1]["matchId"]>(
        args.matchId,
      ),
      targetPlayerId: asPlayerId<Parameters<
        typeof turnFns.resolveActionForSessionEffect
      >[1]["targetPlayerId"]>(args.targetPlayerId),
    });
  }).pipe(Effect.orDie),
);

export const turns = GroupImpl.make(api, "turns").pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
);
