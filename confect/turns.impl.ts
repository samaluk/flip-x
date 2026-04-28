import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { asConfectCtx, asMatchId, asPlayerId, getMutationCtx } from "./lib/ctx";
import * as turnFns from "./turns";

const takeTurn = FunctionImpl.make(api, "turns", "takeTurn", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof turnFns.takeTurnForSession>[0]>(
      yield* getMutationCtx(),
    );
    return yield* turnFns.takeTurnForSession(ctx, {
      ...args,
      matchId: asMatchId<Parameters<typeof turnFns.takeTurnForSession>[1]["matchId"]>(
        args.matchId,
      ),
    });
  }).pipe(Effect.orDie),
);
const resolveAction = FunctionImpl.make(api, "turns", "resolveAction", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof turnFns.resolveActionForSession>[0]>(
      yield* getMutationCtx(),
    );
    return yield* turnFns.resolveActionForSession(ctx, {
      ...args,
      matchId: asMatchId<Parameters<typeof turnFns.resolveActionForSession>[1]["matchId"]>(
        args.matchId,
      ),
      targetPlayerId: asPlayerId<Parameters<
        typeof turnFns.resolveActionForSession
      >[1]["targetPlayerId"]>(args.targetPlayerId),
    });
  }).pipe(Effect.orDie),
);

export const turns = GroupImpl.make(api, "turns").pipe(
  Layer.provide(takeTurn),
  Layer.provide(resolveAction),
);
