import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

const EmptyArgs = Schema.Struct({});

const CleanupCounters = Schema.Struct({
  idempotencyKeys: Schema.Number,
  scoreBreakdowns: Schema.Number,
  roundEvents: Schema.Number,
  roundPlayerStates: Schema.Number,
  rounds: Schema.Number,
  playerSessions: Schema.Number,
  players: Schema.Number,
  matches: Schema.Number,
  presenceRooms: Schema.Number,
  rateLimitKeysReset: Schema.Number,
});

const ClearAllAppDataResult = Schema.Struct({
  deleted: CleanupCounters,
});

const RateLimitKey = Schema.Literal("createMatch", "joinByCode", "joinMatch", "startMatch");

const listMatchIds = FunctionSpec.internalQuery({
  name: "listMatchIds",
  args: () => EmptyArgs,
  returns: () => Schema.Array(Schema.String),
});
const listSessionIds = FunctionSpec.internalQuery({
  name: "listSessionIds",
  args: () => EmptyArgs,
  returns: () => Schema.Array(Schema.String),
});
const resolveDependents = FunctionSpec.internalQuery({
  name: "resolveDependents",
  args: () =>
    Schema.Struct({
      sourceTable: Schema.String,
      parentTable: Schema.String,
      parentId: Schema.String,
    }),
  returns: () => Schema.Array(Schema.String),
});
const deleteDocument = FunctionSpec.internalMutation({
  name: "deleteDocument",
  args: () =>
    Schema.Struct({
      table: Schema.String,
      id: Schema.optional(Schema.String),
    }),
  returns: () => Schema.Number,
});
const removePresenceRoom = FunctionSpec.internalMutation({
  name: "removePresenceRoom",
  args: () =>
    Schema.Struct({
      matchId: Schema.String,
    }),
  returns: () => Schema.Null,
});
const resetRateLimit = FunctionSpec.internalMutation({
  name: "resetRateLimit",
  args: () =>
    Schema.Struct({
      sessionId: Schema.String,
      key: RateLimitKey,
    }),
  returns: () => Schema.Null,
});
const clearAllAppDataViaCli = FunctionSpec.internalMutation({
  name: "clearAllAppDataViaCli",
  args: () => EmptyArgs,
  returns: () => ClearAllAppDataResult,
});

export default GroupSpec.make()
  .addFunction(listMatchIds)
  .addFunction(listSessionIds)
  .addFunction(resolveDependents)
  .addFunction(deleteDocument)
  .addFunction(removePresenceRoom)
  .addFunction(resetRateLimit)
  .addFunction(clearAllAppDataViaCli);
