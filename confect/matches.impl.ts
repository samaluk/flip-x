import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import type { Card } from "../game/logic/card-types";

import api from "./_generated/api";
import { MutationCtx, QueryCtx } from "./_generated/services";
import * as matchFns from "./matches";

function normalizeDeterministicStart(
  deterministicStart: { readonly roundSeed: { readonly drawPile: readonly Card[] } } | undefined,
) {
  if (!deterministicStart) {
    return undefined;
  }

  return {
    roundSeed: {
      drawPile: [...deterministicStart.roundSeed.drawPile],
    },
  };
}

const createMatch = FunctionImpl.make(api, "matches", "createMatch", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.createMatchForSessionEffect
    >[0];
    return yield* matchFns.createMatchForSessionEffect(ctx, args);
  }).pipe(Effect.orDie),
);
const getMatchSnapshot = FunctionImpl.make(
  api,
  "matches",
  "getMatchSnapshot",
  matchFns.getMatchSnapshot,
);
const getMatchByCode = FunctionImpl.make(api, "matches", "getMatchByCode", ({ lobbyCode }) =>
  Effect.gen(function* () {
    const ctx = yield* QueryCtx;
    return yield* matchFns.getMatchByCodeEffect(ctx, lobbyCode);
  }).pipe(Effect.orDie),
);
const joinByCode = FunctionImpl.make(api, "matches", "joinByCode", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.joinByCodeForSessionEffect
    >[0];
    return yield* matchFns.joinByCodeForSessionEffect(ctx, args);
  }).pipe(Effect.orDie),
);
const joinMatch = FunctionImpl.make(api, "matches", "joinMatch", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.joinMatchForSessionEffect
    >[0];
    return yield* matchFns.joinMatchForSessionEffect(ctx, {
      ...args,
      matchId: args.matchId as Parameters<typeof matchFns.joinMatchForSessionEffect>[1]["matchId"],
    });
  }).pipe(Effect.orDie),
);
const startMatch = FunctionImpl.make(api, "matches", "startMatch", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.startMatchForSessionEffect
    >[0];
    return yield* matchFns.startMatchForSessionEffect(ctx, {
      ...args,
      matchId: args.matchId as Parameters<typeof matchFns.startMatchForSessionEffect>[1]["matchId"],
      deterministicStart: normalizeDeterministicStart(args.deterministicStart),
    });
  }).pipe(Effect.orDie),
);

export const matches = GroupImpl.make(api, "matches").pipe(
  Layer.provide(createMatch),
  Layer.provide(getMatchSnapshot),
  Layer.provide(getMatchByCode),
  Layer.provide(joinByCode),
  Layer.provide(joinMatch),
  Layer.provide(startMatch),
);
