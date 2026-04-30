import { Presence } from "@convex-dev/presence";
import { Effect } from "effect";

import { components } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { ActionCtx } from "../convex/_generated/server";
import {
  unsupportedRelationship,
  unsupportedTable,
} from "../shared/lib/errors/domain";
import { ExternalComponentFailed } from "../shared/lib/errors/infrastructure";
import type { DatabaseReader, DatabaseWriter } from "./_generated/services";
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

type RateLimitKey = "createMatch" | "joinByCode" | "joinMatch" | "startMatch";

function collectDependentIdsByRound(
  reader: DatabaseReader,
  table: "roundPlayerStates" | "roundEvents" | "scoreBreakdowns",
  roundId: Id<"rounds">,
) {
  return reader
    .table(table)
    .index("by_round", (query) => query.eq("roundId", roundId))
    .collect()
    .pipe(Effect.map((rows) => rows.map((row) => String(row._id))));
}

export function listMatchIds(
  reader: DatabaseReader,
): Effect.Effect<readonly string[], unknown, never> {
  return reader
    .table("matches")
    .index("by_creation_time")
    .collect()
    .pipe(Effect.map((matches) => matches.map((match) => String(match._id))));
}

export function listSessionIds(
  reader: DatabaseReader,
): Effect.Effect<readonly string[], unknown, never> {
  return reader
    .table("playerSessions")
    .index("by_creation_time")
    .collect()
    .pipe(Effect.map((sessions) => sessions.map((session) => String(session.sessionId))));
}

export function resolveDependents(
  reader: DatabaseReader,
  args: {
    sourceTable: string;
    parentTable: string;
    parentId: string;
  },
): Effect.Effect<readonly string[], unknown, never> {
  return Effect.gen(function* () {
    switch (`${args.sourceTable}:${args.parentTable}`) {
      case "players:matches": {
        const rows = yield* reader
          .table("players")
          .index("by_match", (query) => query.eq("matchId", args.parentId as Id<"matches">))
          .collect();
        return rows.map((row) => String(row._id));
      }
      case "rounds:matches": {
        const rows = yield* reader
          .table("rounds")
          .index("by_match", (query) => query.eq("matchId", args.parentId as Id<"matches">))
          .collect();
        return rows.map((row) => String(row._id));
      }
      case "playerSessions:players": {
        const rows = yield* reader
          .table("playerSessions")
          .index("by_player_id", (query) =>
            query.eq("playerId", args.parentId as Id<"players">),
          )
          .collect();
        return rows.map((row) => String(row._id));
      }
      case "roundPlayerStates:rounds":
        return yield* collectDependentIdsByRound(
          reader,
          "roundPlayerStates",
          args.parentId as Id<"rounds">,
        );
      case "roundEvents:rounds":
        return yield* collectDependentIdsByRound(
          reader,
          "roundEvents",
          args.parentId as Id<"rounds">,
        );
      case "scoreBreakdowns:rounds":
        return yield* collectDependentIdsByRound(
          reader,
          "scoreBreakdowns",
          args.parentId as Id<"rounds">,
        );
      default:
        return yield* unsupportedRelationship();
    }
  });
}

function deleteAllFromTable<TableName extends AppTableName>(
  reader: DatabaseReader,
  writer: DatabaseWriter,
  table: TableName,
) {
  return Effect.gen(function* () {
    console.log(`Removing all documents from table ${table}`);
    const docs = yield* reader.table(table).index("by_creation_time").collect();
    for (const doc of docs) {
      yield* writer.table(table).delete(doc._id as Id<TableName>);
    }
    return docs.length;
  });
}

export function deleteDocument(
  reader: DatabaseReader,
  writer: DatabaseWriter,
  args: {
    table: string;
    id?: string;
  },
): Effect.Effect<number, unknown, never> {
  return Effect.gen(function* () {
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
          return yield* deleteAllFromTable(reader, writer, table);
        }
        console.log(`Removing document from table ${args.table} with id ${args.id}`);
        yield* writer.table(table).delete(args.id as Id<typeof table>);
        return 1;
      default:
        return yield* unsupportedTable({ table: args.table, id: unsupportedId });
    }
  });
}

export function removePresenceRoom(ctx: ActionCtx, args: { matchId: string }) {
  return Effect.tryPromise({
    try: () => presence.removeRoom(ctx, args.matchId),
    catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
  });
}

export function resetRateLimit(
  ctx: ActionCtx,
  args: {
    sessionId: string;
    key: RateLimitKey;
  },
) {
  return Effect.tryPromise({
    try: () => rateLimiter.reset(ctx, args.key, { key: args.sessionId }),
    catch: (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
  });
}

export interface AdminCleanupDeps {
  readonly listSessionIds: Effect.Effect<readonly string[], unknown>;
  readonly listMatchIds: Effect.Effect<readonly string[], unknown>;
  readonly deleteAllFromTable: (table: string) => Effect.Effect<number, ExternalComponentFailed>;
  readonly removePresenceRoom: (matchId: string) => Effect.Effect<void, ExternalComponentFailed>;
  readonly resetRateLimit: (
    sessionId: string,
    key: RateLimitKey,
  ) => Effect.Effect<void, ExternalComponentFailed>;
}

export function runClearAllAppData(
  deps: AdminCleanupDeps,
): Effect.Effect<
  {
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
  },
  unknown,
  never
> {
  return Effect.gen(function* () {
    const sessionIds = yield* deps.listSessionIds;
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
    const matchIds = yield* deps.listMatchIds;
    for (const matchId of matchIds) {
      yield* deps.removePresenceRoom(matchId);
      deleted.presenceRooms += 1;
    }

    // Clear all table data via mutation
    const tables = Object.keys(schema.tables);
    for (const table of tables) {
      console.log(`Removing document from table ${table}`);
      const count = yield* deps.deleteAllFromTable(table);
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
      yield* deps.resetRateLimit(sessionId, "createMatch");
      yield* deps.resetRateLimit(sessionId, "joinByCode");
      yield* deps.resetRateLimit(sessionId, "joinMatch");
      yield* deps.resetRateLimit(sessionId, "startMatch");
      deleted.rateLimitKeysReset += 4;
    }

    return {
      deleted,
    };
  });
}
