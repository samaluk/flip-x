import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import refs from "./_generated/refs";
import {
  ActionCtx,
  ActionRunner,
  DatabaseReader,
  DatabaseWriter,
  MutationRunner,
  QueryRunner,
} from "./_generated/services";
import * as adminFns from "./admin";
import { ExternalComponentFailed } from "../shared/lib/errors/infrastructure";

const listMatchIds = FunctionImpl.make(api, "admin", "listMatchIds", () =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    return yield* adminFns.listMatchIds(reader);
  }).pipe(Effect.orDie),
);
const listSessionIds = FunctionImpl.make(api, "admin", "listSessionIds", () =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    return yield* adminFns.listSessionIds(reader);
  }).pipe(Effect.orDie),
);
const resolveDependents = FunctionImpl.make(api, "admin", "resolveDependents", (args) =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    return yield* adminFns.resolveDependents(reader, args);
  }).pipe(Effect.orDie),
);
const deleteDocument = FunctionImpl.make(api, "admin", "deleteDocument", (args) =>
  Effect.gen(function* () {
    const reader = yield* DatabaseReader;
    const writer = yield* DatabaseWriter;
    return yield* adminFns.deleteDocument(reader, writer, args);
  }).pipe(Effect.orDie),
);
const removePresenceRoom = FunctionImpl.make(api, "admin", "removePresenceRoom", (args) =>
  Effect.gen(function* () {
    const ctx = yield* ActionCtx;
    yield* adminFns.removePresenceRoom(ctx, args);
    return null;
  }).pipe(Effect.orDie),
);
const resetRateLimit = FunctionImpl.make(api, "admin", "resetRateLimit", (args) =>
  Effect.gen(function* () {
    const ctx = yield* ActionCtx;
    yield* adminFns.resetRateLimit(ctx, args);
    return null;
  }).pipe(Effect.orDie),
);
const clearAllAppDataViaCli = FunctionImpl.make(api, "admin", "clearAllAppDataViaCli", () =>
  Effect.gen(function* () {
    const runQuery = yield* QueryRunner;
    const runMutation = yield* MutationRunner;
    const runAction = yield* ActionRunner;

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
        runAction(refs.internal.admin.removePresenceRoom, { matchId }).pipe(
          Effect.mapError(
            (cause) => new ExternalComponentFailed({ component: "presence", cause }),
          ),
          Effect.asVoid,
        ),
      resetRateLimit: (sessionId, key) =>
        runAction(refs.internal.admin.resetRateLimit, { sessionId, key }).pipe(
          Effect.mapError(
            (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
          ),
          Effect.asVoid,
        ),
    });

    return { deleted: result.deleted };
  }).pipe(Effect.orDie),
);

export const admin = GroupImpl.make(api, "admin").pipe(
  Layer.provide(listMatchIds),
  Layer.provide(listSessionIds),
  Layer.provide(resolveDependents),
  Layer.provide(deleteDocument),
  Layer.provide(removePresenceRoom),
  Layer.provide(resetRateLimit),
  Layer.provide(clearAllAppDataViaCli),
);
