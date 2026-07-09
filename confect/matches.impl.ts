import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { makePostHogConvexAnalyticsLayer } from "../shared/analytics/posthog-convex";
import { retainAppErrors } from "../shared/lib/errors/domain";
import databaseSchema from "./_generated/schema";
import groupSpec from "./matches.spec";
import { MutationCtx, QueryCtx } from "./_generated/services";
import { matchIdFromConfectWire } from "./lib/convex-id-bridge";
import { cloneDeterministicStart } from "./lib/deterministic_start";
import { getMatchByCode, joinByCodeForSession } from "./match-lobby";
import { createMatchForSession, joinMatchForSession } from "./match-setup-players";
import { updateMatchSettingsForSession } from "./match-settings";
import { getMatchSnapshot, startMatchForSession } from "./matches";

const createMatch = FunctionImpl.make(databaseSchema, groupSpec, "createMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* createMatchForSession(ctx, args).pipe(
      Effect.provide(makePostHogConvexAnalyticsLayer(ctx)),
    );
  }).pipe(retainAppErrors),
);
const getMatchSnapshotImpl = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "getMatchSnapshot",
  getMatchSnapshot,
);
const getMatchByCodeImpl = FunctionImpl.make(databaseSchema, groupSpec, "getMatchByCode", (args) =>
  Effect.gen(function* () {
    const ctx = yield* QueryCtx;
    return yield* getMatchByCode(ctx, args.lobbyCode);
  }).pipe(retainAppErrors),
);
const joinByCode = FunctionImpl.make(databaseSchema, groupSpec, "joinByCode", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* joinByCodeForSession(ctx, args);
  }).pipe(retainAppErrors),
);
const joinMatch = FunctionImpl.make(databaseSchema, groupSpec, "joinMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* joinMatchForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
    }).pipe(Effect.provide(makePostHogConvexAnalyticsLayer(ctx)));
  }).pipe(retainAppErrors),
);
const startMatch = FunctionImpl.make(databaseSchema, groupSpec, "startMatch", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    return yield* startMatchForSession(ctx, {
      ...args,
      matchId: matchIdFromConfectWire(args.matchId),
      deterministicStart: cloneDeterministicStart(args.deterministicStart),
    });
  }).pipe(retainAppErrors),
);
const updateMatchSettings = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "updateMatchSettings",
  (args) =>
    Effect.gen(function* () {
      const ctx = yield* MutationCtx;
      return yield* updateMatchSettingsForSession(ctx, {
        ...args,
        matchId: matchIdFromConfectWire(args.matchId),
      });
    }).pipe(retainAppErrors),
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(createMatch),
  Layer.provide(getMatchSnapshotImpl),
  Layer.provide(getMatchByCodeImpl),
  Layer.provide(joinByCode),
  Layer.provide(joinMatch),
  Layer.provide(startMatch),
  Layer.provide(updateMatchSettings),
  GroupImpl.finalize,
);
