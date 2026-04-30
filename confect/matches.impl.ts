import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/services";
import * as matchFns from "./matches";

const createMatch = FunctionImpl.make(api, "matches", "createMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* matchFns.createMatchForSession(ctx, args);
  }).pipe(Effect.orDie),
);
const getMatchSnapshot = FunctionImpl.make(
  api,
  "matches",
  "getMatchSnapshot",
  matchFns.getMatchSnapshot,
);
const getMatchByCode = FunctionImpl.make(api, "matches", "getMatchByCode", (args) =>
  Effect.gen(function* () {
    const ctx = yield* QueryCtx;
    return yield* matchFns.getMatchByCode(ctx, args.lobbyCode);
  }).pipe(Effect.orDie),
);
const joinByCode = FunctionImpl.make(api, "matches", "joinByCode", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* matchFns.joinByCodeForSession(ctx, args);
  }).pipe(Effect.orDie),
);
const joinMatch = FunctionImpl.make(api, "matches", "joinMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* matchFns.joinMatchForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
    });
  }).pipe(Effect.orDie),
);
const startMatch = FunctionImpl.make(api, "matches", "startMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* matchFns.startMatchForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
      deterministicStart: args.deterministicStart
        ? { roundSeed: { drawPile: [...args.deterministicStart.roundSeed.drawPile] } }
        : undefined,
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
