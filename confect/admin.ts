import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { Effect } from "effect";

import { internal, components } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { ActionCtx } from "../convex/_generated/server";
import { action, internalMutation, internalQuery } from "../convex/_generated/server";
import {
  UnsupportedRelationship,
  UnsupportedTable,
  InvalidConfirmation,
} from "../shared/lib/errors/domain";
import { cascadingDeletes } from "./lib/cascading_deletes";
import { rateLimiter } from "./lib/rate_limiter";

const DELETE_ALL_APP_DATA_CONFIRMATION = "DELETE_ALL_APP_DATA";
const presence = new Presence(components.presence);

type AppTableName =
  | "matches"
  | "players"
  | "playerSessions"
  | "rounds"
  | "roundPlayerStates"
  | "roundEvents"
  | "scoreBreakdowns";

type ClearAllAppDataResult = {
  deleted: {
    scoreBreakdowns: number;
    roundEvents: number;
    roundPlayerStates: number;
    rounds: number;
    playerSessions: number;
    players: number;
    matches: number;
    presenceRooms: number;
    rateLimitKeysReset: number;
  };
  confirmation: string;
};

export const listMatchIds = internalQuery({
  args: {},
  handler: async (ctx) =>
    await Effect.runPromise(
      Effect.gen(function* () {
        const matches = yield* Effect.promise(() => ctx.db.query("matches").collect());
        return matches.map((match) => String(match._id));
      }),
    ),
});

export const listSessionIds = internalQuery({
  args: {},
  handler: async (ctx) =>
    await Effect.runPromise(
      Effect.gen(function* () {
        const sessions = yield* Effect.promise(() => ctx.db.query("playerSessions").collect());
        return sessions.map((session) => String(session.sessionId));
      }),
    ),
});

export const resolveDependents = internalQuery({
  args: {
    sourceTable: v.string(),
    parentTable: v.string(),
    parentId: v.string(),
  },
  handler: async (ctx, args) =>
    await Effect.runPromise(
      Effect.gen(function* () {
    switch (`${args.sourceTable}:${args.parentTable}`) {
      case "players:matches": {
        const rows = yield* Effect.promise(() =>
          ctx.db
            .query("players")
            .withIndex("by_match", (query) => query.eq("matchId", args.parentId as Id<"matches">))
            .collect(),
        );
        return rows.map((row) => String(row._id));
      }
      case "rounds:matches": {
        const rows = yield* Effect.promise(() =>
          ctx.db
            .query("rounds")
            .withIndex("by_match", (query) => query.eq("matchId", args.parentId as Id<"matches">))
            .collect(),
        );
        return rows.map((row) => String(row._id));
      }
      case "playerSessions:players": {
        const rows = yield* Effect.promise(() =>
          ctx.db
            .query("playerSessions")
            .withIndex("by_player_id", (query) =>
              query.eq("playerId", args.parentId as Id<"players">),
            )
            .collect(),
        );
        return rows.map((row) => String(row._id));
      }
      case "roundPlayerStates:rounds": {
        const rows = yield* Effect.promise(() =>
          ctx.db
            .query("roundPlayerStates")
            .withIndex("by_round", (query) => query.eq("roundId", args.parentId as Id<"rounds">))
            .collect(),
        );
        return rows.map((row) => String(row._id));
      }
      case "roundEvents:rounds": {
        const rows = yield* Effect.promise(() =>
          ctx.db
            .query("roundEvents")
            .withIndex("by_round", (query) => query.eq("roundId", args.parentId as Id<"rounds">))
            .collect(),
        );
        return rows.map((row) => String(row._id));
      }
      case "scoreBreakdowns:rounds": {
        const rows = yield* Effect.promise(() =>
          ctx.db
            .query("scoreBreakdowns")
            .withIndex("by_round", (query) => query.eq("roundId", args.parentId as Id<"rounds">))
            .collect(),
        );
        return rows.map((row) => String(row._id));
      }
      default:
        return yield* new UnsupportedRelationship();
    }
      }),
    ),
});

export const deleteDocument = internalMutation({
  args: {
    table: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) =>
    await Effect.runPromise(
      Effect.gen(function* () {
    switch (args.table as AppTableName) {
      case "matches":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"matches">));
        return;
      case "players":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"players">));
        return;
      case "playerSessions":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"playerSessions">));
        return;
      case "rounds":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"rounds">));
        return;
      case "roundPlayerStates":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"roundPlayerStates">));
        return;
      case "roundEvents":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"roundEvents">));
        return;
      case "scoreBreakdowns":
        yield* Effect.promise(() => ctx.db.delete(args.id as Id<"scoreBreakdowns">));
        return;
      default:
        return yield* new UnsupportedTable();
    }
      }),
    ),
});

export const clearAllAppDataViaCli = action({
  args: {
    confirm: v.string(),
  },
  handler: async (ctx, args): Promise<ClearAllAppDataResult> => {
    return await Effect.runPromise(runClearAllAppDataEffect(ctx, args.confirm));
  },
});

function runClearAllAppDataEffect(ctx: ActionCtx, confirm: string) {
  return Effect.gen(function* () {
    if (confirm !== DELETE_ALL_APP_DATA_CONFIRMATION) {
      return yield* new InvalidConfirmation();
    }

  const matchIds = yield* Effect.promise(() => ctx.runQuery(internal.admin.listMatchIds, {}));
  const sessionIds = yield* Effect.promise(() => ctx.runQuery(internal.admin.listSessionIds, {}));
  const deleted = {
    scoreBreakdowns: 0,
    roundEvents: 0,
    roundPlayerStates: 0,
    rounds: 0,
    playerSessions: 0,
    players: 0,
    matches: 0,
    presenceRooms: 0,
    rateLimitKeysReset: 0,
  };

  for (const matchId of matchIds) {
    yield* Effect.promise(() => presence.removeRoom(ctx, matchId));
    deleted.presenceRooms += 1;
  }

  for (const matchId of matchIds) {
    const counts = yield* Effect.promise(() =>
      cascadingDeletes.deleteWithCascade(ctx, {
      table: "matches",
      id: matchId,
      resolver: async (sourceTable, parentTable, parentId) =>
        await ctx.runQuery(internal.admin.resolveDependents, {
          sourceTable,
          parentTable,
          parentId,
        }),
      deleter: async (table, id) => {
        await ctx.runMutation(internal.admin.deleteDocument, {
          table,
          id,
        });
      },
      }),
    );

    deleted.scoreBreakdowns += counts.scoreBreakdowns ?? 0;
    deleted.roundEvents += counts.roundEvents ?? 0;
    deleted.roundPlayerStates += counts.roundPlayerStates ?? 0;
    deleted.rounds += counts.rounds ?? 0;
    deleted.playerSessions += counts.playerSessions ?? 0;
    deleted.players += counts.players ?? 0;
    deleted.matches += counts.matches ?? 0;
  }

  for (const sessionId of sessionIds) {
    yield* Effect.promise(() => rateLimiter.reset(ctx, "createMatch", { key: sessionId }));
    yield* Effect.promise(() => rateLimiter.reset(ctx, "joinByCode", { key: sessionId }));
    yield* Effect.promise(() => rateLimiter.reset(ctx, "joinMatch", { key: sessionId }));
    yield* Effect.promise(() => rateLimiter.reset(ctx, "startMatch", { key: sessionId }));
    deleted.rateLimitKeysReset += 4;
  }

  return {
    deleted,
    confirmation: DELETE_ALL_APP_DATA_CONFIRMATION,
  };
  });
}
