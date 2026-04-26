import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import {
  asConfectCtx,
  asMatchId,
  getMutationCtx,
  getQueryCtx,
  normalizeDeterministicStart,
} from "./lib/ctx";
import * as matchFns from "./matches";

const createMatch = FunctionImpl.make(api, "matches", "createMatch", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof matchFns.createMatchForSessionEffect>[0]>(
      yield* getMutationCtx(),
    );
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
    const ctx = yield* getQueryCtx();
    return yield* matchFns.getMatchByCodeEffect(ctx, lobbyCode);
  }).pipe(Effect.orDie),
);
const joinByCode = FunctionImpl.make(api, "matches", "joinByCode", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof matchFns.joinByCodeForSessionEffect>[0]>(
      yield* getMutationCtx(),
    );
    return yield* matchFns.joinByCodeForSessionEffect(ctx, args);
  }).pipe(Effect.orDie),
);
const joinMatch = FunctionImpl.make(api, "matches", "joinMatch", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof matchFns.joinMatchForSessionEffect>[0]>(
      yield* getMutationCtx(),
    );
    return yield* matchFns.joinMatchForSessionEffect(ctx, {
      ...args,
      matchId: asMatchId<Parameters<typeof matchFns.joinMatchForSessionEffect>[1]["matchId"]>(
        args.matchId,
      ),
    });
  }).pipe(Effect.orDie),
);
const startMatch = FunctionImpl.make(api, "matches", "startMatch", (args) =>
  Effect.gen(function* () {
    const ctx = asConfectCtx<Parameters<typeof matchFns.startMatchForSessionEffect>[0]>(
      yield* getMutationCtx(),
    );
    return yield* matchFns.startMatchForSessionEffect(ctx, {
      ...args,
      matchId: asMatchId<Parameters<typeof matchFns.startMatchForSessionEffect>[1]["matchId"]>(
        args.matchId,
      ),
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
