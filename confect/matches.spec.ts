import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { DeterministicStartOptions } from "./deterministic-schema";
import { MatchSnapshot } from "./match-snapshot-schema";
import * as matchFns from "./matches";
import { SessionIdField } from "./session";

const CommandMetadata = {
  expectedVersion: Schema.Number,
  idempotencyKey: Schema.String,
};

const MatchLookupResult = Schema.Struct({
  matchId: Schema.String,
  lobbyCode: Schema.String,
  status: Schema.Literal("setup"),
  usedColorIds: Schema.Array(Schema.String),
});

const getMatchByCode = FunctionSpec.publicQuery({
  name: "getMatchByCode",
  args: Schema.Struct({
    lobbyCode: Schema.String,
  }),
  returns: Schema.Union(Schema.Null, MatchLookupResult),
});

const createMatch = FunctionSpec.publicMutation({
  name: "createMatch",
  args: Schema.Struct({
    ...SessionIdField,
    hostName: Schema.String,
    hostColorId: Schema.optional(Schema.String),
  }),
  returns: MatchSnapshot,
});
const getMatchSnapshot =
  FunctionSpec.convexPublicQuery<typeof matchFns.getMatchSnapshot>()("getMatchSnapshot");
const joinByCode = FunctionSpec.publicMutation({
  name: "joinByCode",
  args: Schema.Struct({
    ...SessionIdField,
    lobbyCode: Schema.String,
  }),
  returns: Schema.Struct({
    matchId: Schema.String,
    lobbyCode: Schema.String,
  }),
});
const joinMatch = FunctionSpec.publicMutation({
  name: "joinMatch",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
    playerName: Schema.String,
    playerColorId: Schema.optional(Schema.String),
  }),
  returns: MatchSnapshot,
});
const startMatch = FunctionSpec.publicMutation({
  name: "startMatch",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
    ...CommandMetadata,
    deterministicStart: Schema.optional(DeterministicStartOptions),
  }),
  returns: MatchSnapshot,
});

export const matches = GroupSpec.make("matches")
  .addFunction(createMatch)
  .addFunction(getMatchSnapshot)
  .addFunction(getMatchByCode)
  .addFunction(joinByCode)
  .addFunction(joinMatch)
  .addFunction(startMatch);
