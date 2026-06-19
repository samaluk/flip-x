import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import databaseSchema from "./_generated/schema";
import groupSpec from "./admin.spec";
import refs from "./_generated/refs";
import {
  DatabaseReader,
  DatabaseWriter,
  MutationCtx,
  MutationRunner,
  QueryRunner,
} from "./_generated/services";
import * as adminFns from "./admin";
import { ExternalComponentFailed } from "../shared/lib/errors/infrastructure";

const listMatchIds = FunctionImpl.make(databaseSchema, groupSpec, "listMatchIds", () =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    return yield* adminFns.listMatchIds(reader);
  }).pipe(Effect.orDie),
);
const listSessionIds = FunctionImpl.make(databaseSchema, groupSpec, "listSessionIds", () =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    return yield* adminFns.listSessionIds(reader);
  }).pipe(Effect.orDie),
);
const resolveDependents = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "resolveDependents",
  (args) =>
    Effect.gen(function* () {
      const reader = yield* DatabaseReader;
      return yield* adminFns.resolveDependents(reader, args);
    }).pipe(Effect.orDie),
);
const deleteDocument = FunctionImpl.make(databaseSchema, groupSpec, "deleteDocument", (args) =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    const writer = yield* DatabaseWriter;
    return yield* adminFns.deleteDocument(reader, writer, args);
  }).pipe(Effect.orDie),
);
const removePresenceRoom = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "removePresenceRoom",
  (args) =>
    Effect.gen(function* () {
      const ctx = yield* MutationCtx;
      yield* adminFns.removePresenceRoom(ctx, args);
      return null;
    }).pipe(Effect.orDie),
);
const resetRateLimit = FunctionImpl.make(databaseSchema, groupSpec, "resetRateLimit", (args) =>
  Effect.gen(function* () {
    const ctx = yield* MutationCtx;
    yield* adminFns.resetRateLimit(ctx, args);
    return null;
  }).pipe(Effect.orDie),
);
const clearAllAppDataViaCli = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "clearAllAppDataViaCli",
  () =>
    Effect.gen(function* () {
      const runQuery = yield* QueryRunner;
      const runMutation = yield* MutationRunner;

      const result = yield* adminFns.runClearAllAppData({
        listSessionIds: runQuery(refs.internal.admin.listSessionIds, {}),
        listMatchIds: runQuery(refs.internal.admin.listMatchIds, {}),
        deleteAllFromTable: (table) =>
          runMutation(refs.internal.admin.deleteDocument, { table }).pipe(
            Effect.mapError(
              (cause) => new ExternalComponentFailed({ component: "deleteDocument", cause }),
            ),
          ),
        removePresenceRoom: (matchId) =>
          runMutation(refs.internal.admin.removePresenceRoom, { matchId }).pipe(
            Effect.mapError(
              (cause) => new ExternalComponentFailed({ component: "presence", cause }),
            ),
            Effect.asVoid,
          ),
        resetRateLimit: (sessionId, key) =>
          runMutation(refs.internal.admin.resetRateLimit, { sessionId, key }).pipe(
            Effect.mapError(
              (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
            ),
            Effect.asVoid,
          ),
      });

      return { deleted: result.deleted };
    }).pipe(Effect.orDie),
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(listMatchIds),
  Layer.provide(listSessionIds),
  Layer.provide(resolveDependents),
  Layer.provide(deleteDocument),
  Layer.provide(removePresenceRoom),
  Layer.provide(resetRateLimit),
  Layer.provide(clearAllAppDataViaCli),
  GroupImpl.finalize,
);
