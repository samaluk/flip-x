import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { Effect } from "effect";

import { internal, components } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { ActionCtx, QueryCtx } from "../convex/_generated/server";
import { action, internalMutation, internalQuery } from "../convex/_generated/server";
import {
  unsupportedRelationship,
  unsupportedTable,
} from "../shared/lib/errors/domain";
import { ExternalComponentFailed } from "../shared/lib/errors/infrastructure";
import { rateLimiter } from "./lib/rate_limiter";
import schema from "./schema";

const presence = new Presence(components.presence);

type AppTableName =
  | "matches"
  | "players"
  | "playerSessions"
  | "rounds"
  | "roundPlayerStates"
  | "roundEvents"
  | "scoreBreakdowns"
  | "idempotencyKeys";

type ClearAllAppDataResult = {
  deleted: {
    idempotencyKeys: number;
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
};

async function collectDependentIdsByRound(
  ctx: QueryCtx,
  table: "roundPlayerStates" | "roundEvents" | "scoreBreakdowns",
  roundId: Id<"rounds">,
): Promise<string[]> {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();
  return rows.map((row) => String(row._id));
}

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
      case "roundPlayerStates:rounds":
        return yield* Effect.promise(() =>
          collectDependentIdsByRound(ctx, "roundPlayerStates", args.parentId as Id<"rounds">),
        );
      case "roundEvents:rounds":
        return yield* Effect.promise(() =>
          collectDependentIdsByRound(ctx, "roundEvents", args.parentId as Id<"rounds">),
        );
      case "scoreBreakdowns:rounds":
        return yield* Effect.promise(() =>
          collectDependentIdsByRound(ctx, "scoreBreakdowns", args.parentId as Id<"rounds">),
        );
      default:
        return yield* unsupportedRelationship();
    }
      }),
    ),
});

export const deleteDocument = internalMutation({
  args: {
    table: v.string(),
    id: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await Effect.runPromise(
      Effect.gen(function* () {
        const table = args.table as AppTableName;
        const unsupportedId = args.id ?? "";

        switch (table) {
          case "matches":
          case "players":
          case "playerSessions":
          case "rounds":
          case "roundPlayerStates":
          case "roundEvents":
          case "scoreBreakdowns":
          case "idempotencyKeys":
            if (args.id === undefined) {
              console.log(`Removing all documents from table ${args.table}`);
              const docs = yield* Effect.promise(() =>
                ctx.db.query(table as any).collect(),
              );
              for (const doc of docs as any[]) {
                yield* Effect.promise(() => ctx.db.delete(doc._id));
              }
              return docs.length;
            }
            console.log(`Removing document from table ${args.table} with id ${args.id}`);
            yield* Effect.promise(() =>
              ctx.db.delete(args.id as Id<typeof table>),
            );
            return 1;
          default:
            return yield* unsupportedTable({ table: args.table, id: unsupportedId });
        }
      }),
    ),
});

export const clearAllAppDataViaCli = action({
  handler: async (ctx): Promise<ClearAllAppDataResult> => {
    const deleted = await Effect.runPromise(runClearAllAppData(ctx));
    return {
      deleted: deleted.deleted,
    };
  },
});

function runClearAllAppData(ctx: ActionCtx) {
  return Effect.gen(function* () {
  const sessionIds = yield* Effect.promise(() => ctx.runQuery(internal.admin.listSessionIds, {}));
  const deleted = {
    idempotencyKeys: 0,
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

  // Clean up presence rooms
  const matchIds = yield* Effect.promise(() => ctx.runQuery(internal.admin.listMatchIds, {}));
  for (const matchId of matchIds) {
    yield* Effect.tryPromise({
      try: () => presence.removeRoom(ctx, matchId),
      catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
    });
    deleted.presenceRooms += 1;
  }

  // Clear all table data via mutation (which has ctx.db access)

  const tables = Object.keys(schema.tables);
  for (const table of tables) {
    console.log(`Removing document from table ${table}`);
    const count = yield* Effect.tryPromise({
      try: () => ctx.runMutation(internal.admin.deleteDocument, { table: table }),
      catch: (cause) => new ExternalComponentFailed({ component: "deleteDocument", cause }),
    });
    switch (table) {
      case "idempotencyKeys":
        deleted.idempotencyKeys += count;
        break;
      case "scoreBreakdowns":
        deleted.scoreBreakdowns += count;
        break;
      case "roundEvents":
        deleted.roundEvents += count;
        break;
      case "roundPlayerStates":
        deleted.roundPlayerStates += count;
        break;
      case "rounds":
        deleted.rounds += count;
        break;
      case "playerSessions":
        deleted.playerSessions += count;
        break;
      case "players":
        deleted.players += count;
        break;
      case "matches":
        deleted.matches += count;
        break;
      default:
        break;
    }
  }

  // Reset rate limiters
  for (const sessionId of sessionIds) {
    yield* Effect.tryPromise({
      try: () => rateLimiter.reset(ctx, "createMatch", { key: sessionId }),
      catch: (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
    });
    yield* Effect.tryPromise({
      try: () => rateLimiter.reset(ctx, "joinByCode", { key: sessionId }),
      catch: (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
    });
    yield* Effect.tryPromise({
      try: () => rateLimiter.reset(ctx, "joinMatch", { key: sessionId }),
      catch: (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
    });
    yield* Effect.tryPromise({
      try: () => rateLimiter.reset(ctx, "startMatch", { key: sessionId }),
      catch: (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
    });
    deleted.rateLimitKeysReset += 4;
  }

  return {
    deleted
  };
  });
}
