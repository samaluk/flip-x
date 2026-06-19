import { Presence } from "@convex-dev/presence";
import { Effect } from "effect";

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- admin cleanup uses dynamic table/id wiring against Convex typed indexes */

import { components } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { unsupportedRelationship, unsupportedTable } from "../shared/lib/errors/domain";
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
type CleanupDeleted = {
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

const appTableNames = new Set<string>(Object.keys(schema.tables));
const cleanupTableCounters: Partial<Record<AppTableName, keyof CleanupDeleted>> = {
  idempotencyKeys: "idempotencyKeys",
  scoreBreakdowns: "scoreBreakdowns",
  roundEvents: "roundEvents",
  roundPlayerStates: "roundPlayerStates",
  rounds: "rounds",
  playerSessions: "playerSessions",
  players: "players",
  matches: "matches",
};
const rateLimitKeys: readonly RateLimitKey[] = [
  "createMatch",
  "joinByCode",
  "joinMatch",
  "startMatch",
];

function isAppTableName(table: string): table is AppTableName {
  return appTableNames.has(table);
}

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

function collectDependentIdsByMatch(
  reader: DatabaseReader,
  table: "players" | "rounds",
  matchId: string,
) {
  return reader
    .table(table)
    .index("by_match", (query) => query.eq("matchId", matchId as Id<"matches">))
    .collect()
    .pipe(Effect.map((rows) => rows.map((row) => String(row._id))));
}

function collectPlayerSessionIdsByPlayer(reader: DatabaseReader, playerId: string) {
  return reader
    .table("playerSessions")
    .index("by_player_id", (query) => query.eq("playerId", playerId as Id<"players">))
    .collect()
    .pipe(Effect.map((rows) => rows.map((row) => String(row._id))));
}

export function listMatchIds(reader: DatabaseReader): Effect.Effect<readonly string[], unknown> {
  return reader
    .table("matches")
    .index("by_creation_time")
    .collect()
    .pipe(Effect.map((matches) => matches.map((match) => String(match._id))));
}

export function listSessionIds(reader: DatabaseReader): Effect.Effect<readonly string[], unknown> {
  return reader
    .table("playerSessions")
    .index("by_creation_time")
    .collect()
    .pipe(Effect.map((sessions) => sessions.map((session) => session.sessionId)));
}

export function resolveDependents(
  reader: DatabaseReader,
  args: {
    sourceTable: string;
    parentTable: string;
    parentId: string;
  },
): Effect.Effect<readonly string[], unknown> {
  const resolver = dependentResolvers[`${args.sourceTable}:${args.parentTable}`];
  return resolver ? resolver(reader, args.parentId) : unsupportedRelationship();
}

function deleteAllFromTable(reader: DatabaseReader, writer: DatabaseWriter, table: AppTableName) {
  return Effect.gen(function* () {
    console.log(`Removing all documents from table ${table}`);
    const docs = yield* reader.table(table).index("by_creation_time").collect();
    for (const doc of docs) {
      yield* writer.table(table).delete(doc._id);
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
): Effect.Effect<number, unknown> {
  return Effect.gen(function* () {
    if (!isAppTableName(args.table)) {
      return yield* unsupportedTable({ table: args.table, id: args.id ?? "" });
    }

    if (args.id === undefined) {
      return yield* deleteAllFromTable(reader, writer, args.table);
    }

    console.log(`Removing document from table ${args.table} with id ${args.id}`);
    yield* writer.table(args.table).delete(args.id as Id<typeof args.table>);
    return 1;
  });
}

export function removePresenceRoom(ctx: MutationCtx, args: { matchId: string }) {
  return Effect.tryPromise({
    try: () => presence.removeRoom(ctx, args.matchId),
    catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
  });
}

export function resetRateLimit(
  ctx: MutationCtx,
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

interface AdminCleanupDeps {
  readonly listSessionIds: Effect.Effect<readonly string[], unknown>;
  readonly listMatchIds: Effect.Effect<readonly string[], unknown>;
  readonly deleteAllFromTable: (table: string) => Effect.Effect<number, ExternalComponentFailed>;
  readonly removePresenceRoom: (matchId: string) => Effect.Effect<void, ExternalComponentFailed>;
  readonly resetRateLimit: (
    sessionId: string,
    key: RateLimitKey,
  ) => Effect.Effect<void, ExternalComponentFailed>;
}

function initialCleanupDeleted(): CleanupDeleted {
  return {
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
}

function removePresenceRooms(deps: AdminCleanupDeps, matchIds: readonly string[]) {
  return Effect.gen(function* () {
    for (const matchId of matchIds) {
      yield* deps.removePresenceRoom(matchId);
    }
    return matchIds.length;
  });
}

function deleteAppTables(deps: AdminCleanupDeps, deleted: CleanupDeleted) {
  return Effect.gen(function* () {
    for (const table of Object.keys(schema.tables) as AppTableName[]) {
      console.log(`Removing document from table ${table}`);
      const count = yield* deps.deleteAllFromTable(table);
      const counter = cleanupTableCounters[table];
      if (counter) {
        deleted[counter] += count;
      }
    }
  });
}

function resetSessionRateLimits(deps: AdminCleanupDeps, sessionIds: readonly string[]) {
  return Effect.gen(function* () {
    for (const sessionId of sessionIds) {
      for (const key of rateLimitKeys) {
        yield* deps.resetRateLimit(sessionId, key);
      }
    }
    return sessionIds.length * rateLimitKeys.length;
  });
}

export function runClearAllAppData(deps: AdminCleanupDeps): Effect.Effect<
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
  unknown
> {
  return Effect.gen(function* () {
    const sessionIds = yield* deps.listSessionIds;
    const deleted = initialCleanupDeleted();

    const matchIds = yield* deps.listMatchIds;
    deleted.presenceRooms = yield* removePresenceRooms(deps, matchIds);
    yield* deleteAppTables(deps, deleted);
    deleted.rateLimitKeysReset = yield* resetSessionRateLimits(deps, sessionIds);

    return {
      deleted,
    };
  });
}

const dependentResolvers: Record<
  string,
  (reader: DatabaseReader, parentId: string) => Effect.Effect<readonly string[], unknown>
> = {
  "players:matches": (reader, parentId) => collectDependentIdsByMatch(reader, "players", parentId),
  "rounds:matches": (reader, parentId) => collectDependentIdsByMatch(reader, "rounds", parentId),
  "playerSessions:players": collectPlayerSessionIdsByPlayer,
  "roundPlayerStates:rounds": (reader, parentId) =>
    collectDependentIdsByRound(reader, "roundPlayerStates", parentId as Id<"rounds">),
  "roundEvents:rounds": (reader, parentId) =>
    collectDependentIdsByRound(reader, "roundEvents", parentId as Id<"rounds">),
  "scoreBreakdowns:rounds": (reader, parentId) =>
    collectDependentIdsByRound(reader, "scoreBreakdowns", parentId as Id<"rounds">),
};
