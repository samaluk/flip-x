import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import type { Id } from "../convex/_generated/dataModel";
import api from "./_generated/api";
import { MutationCtx, QueryCtx } from "./_generated/services";
import { cloneDeterministicStart } from "./lib/deterministic_start";
import { getMatchByCode, joinByCodeForSession } from "./match-lobby";
import { createMatchForSession, joinMatchForSession } from "./match-setup-players";
import { updateMatchSettingsForSession } from "./match-settings";
import { getMatchSnapshot, startMatchForSession } from "./matches";

const createMatch = FunctionImpl.make(api, "matches", "createMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* createMatchForSession(ctx, args);
  }).pipe(Effect.orDie),
);
const getMatchSnapshotImpl = FunctionImpl.make(
  api,
  "matches",
  "getMatchSnapshot",
  getMatchSnapshot,
);
const getMatchByCodeImpl = FunctionImpl.make(api, "matches", "getMatchByCode", (args) =>
  Effect.gen(function* () {
    const ctx = yield* QueryCtx;
    return yield* getMatchByCode(ctx, args.lobbyCode);
  }).pipe(Effect.orDie),
);
const joinByCode = FunctionImpl.make(api, "matches", "joinByCode", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* joinByCodeForSession(ctx, args);
  }).pipe(Effect.orDie),
);
const joinMatch = FunctionImpl.make(api, "matches", "joinMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* joinMatchForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
    });
  }).pipe(Effect.orDie),
);
const startMatch = FunctionImpl.make(api, "matches", "startMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* startMatchForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
      deterministicStart: cloneDeterministicStart(args.deterministicStart),
    });
  }).pipe(Effect.orDie),
);
const updateMatchSettings = FunctionImpl.make(api, "matches", "updateMatchSettings", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* updateMatchSettingsForSession(ctx, {
      ...args,
      matchId: args.matchId as Id<"matches">,
    });
  }).pipe(Effect.orDie),
);

export const matches = GroupImpl.make(api, "matches").pipe(
  Layer.provide(createMatch),
  Layer.provide(getMatchSnapshotImpl),
  Layer.provide(getMatchByCodeImpl),
  Layer.provide(joinByCode),
  Layer.provide(joinMatch),
  Layer.provide(startMatch),
  Layer.provide(updateMatchSettings),
);
