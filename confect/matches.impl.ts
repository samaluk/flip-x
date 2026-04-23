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
      typeof matchFns.createMatchForSession
    >[0];
    return yield* Effect.promise(() => matchFns.createMatchForSession(ctx, args));
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
    const normalized = lobbyCode.trim().toUpperCase();

    if (normalized.length !== 4) {
      return null;
    }

    const match = yield* Effect.promise(() =>
      ctx.db
        .query("matches")
        .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", normalized))
        .first(),
    );

    if (!match || match.status !== "setup") {
      return null;
    }

    const players = yield* Effect.promise(() =>
      ctx.db
        .query("players")
        .withIndex("by_match", (query) => query.eq("matchId", match._id))
        .collect(),
    );

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
      status: match.status,
      usedColorIds: players
        .map((player) => player.colorId)
        .filter((colorId): colorId is string => typeof colorId === "string"),
    };
  }).pipe(Effect.orDie),
);
const joinByCode = FunctionImpl.make(api, "matches", "joinByCode", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.joinByCodeForSession
    >[0];
    return yield* Effect.promise(() => matchFns.joinByCodeForSession(ctx, args));
  }).pipe(Effect.orDie),
);
const joinMatch = FunctionImpl.make(api, "matches", "joinMatch", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.joinMatchForSession
    >[0];
    return yield* Effect.promise(() =>
      matchFns.joinMatchForSession(ctx, {
        ...args,
        matchId: args.matchId as Parameters<typeof matchFns.joinMatchForSession>[1]["matchId"],
      }),
    );
  }).pipe(Effect.orDie),
);
const startMatch = FunctionImpl.make(api, "matches", "startMatch", (args) =>
  Effect.gen(function* () {
    const ctx = (yield* MutationCtx) as unknown as Parameters<
      typeof matchFns.startMatchForSession
    >[0];
    return yield* Effect.promise(() =>
      matchFns.startMatchForSession(ctx, {
        ...args,
        matchId: args.matchId as Parameters<typeof matchFns.startMatchForSession>[1]["matchId"],
        deterministicStart: normalizeDeterministicStart(args.deterministicStart),
      }),
    );
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
