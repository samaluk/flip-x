import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

import { DeterministicStartOptions } from "./deterministic-schema";
import { MatchSnapshot } from "./match-snapshot-schema";
import { getMatchSnapshot } from "./matches";
import { SessionIdField } from "./session";

const CommandMetadata = {
  expectedVersion: Schema.Number,
  idempotencyKey: Schema.String,
};

const VersionMetadata = {
  expectedVersion: Schema.Number,
};

const GameSettingsPatch = Schema.Struct({
  targetScore: Schema.optional(Schema.Number),
  maxNumberCardValue: Schema.optional(Schema.Number),
});

const MatchLookupResult = Schema.Struct({
  matchId: Schema.String,
  lobbyCode: Schema.String,
  status: Schema.Literal("setup", "in_progress"),
  usedColorIds: Schema.Array(Schema.String),
});

const getMatchByCode = FunctionSpec.publicQuery({
  name: "getMatchByCode",
  args: () =>
    Schema.Struct({
      lobbyCode: Schema.String,
    }),
  returns: () => Schema.Union(Schema.Null, MatchLookupResult),
});

const createMatch = FunctionSpec.publicMutation({
  name: "createMatch",
  args: () =>
    Schema.Struct({
      ...SessionIdField,
      hostName: Schema.String,
      hostColorId: Schema.optional(Schema.String),
    }),
  returns: () => MatchSnapshot,
});
const getMatchSnapshotSpec =
  FunctionSpec.convexPublicQuery<typeof getMatchSnapshot>()("getMatchSnapshot");
const joinByCode = FunctionSpec.publicMutation({
  name: "joinByCode",
  args: () =>
    Schema.Struct({
      ...SessionIdField,
      lobbyCode: Schema.String,
    }),
  returns: () =>
    Schema.Struct({
      matchId: Schema.String,
      lobbyCode: Schema.String,
    }),
});
const joinMatch = FunctionSpec.publicMutation({
  name: "joinMatch",
  args: () =>
    Schema.Struct({
      ...SessionIdField,
      matchId: Schema.String,
      playerName: Schema.String,
      playerColorId: Schema.optional(Schema.String),
    }),
  returns: () => MatchSnapshot,
});
const startMatch = FunctionSpec.publicMutation({
  name: "startMatch",
  args: () =>
    Schema.Struct({
      ...SessionIdField,
      matchId: Schema.String,
      ...CommandMetadata,
      deterministicStart: Schema.optional(DeterministicStartOptions),
    }),
  returns: () => MatchSnapshot,
});
const updateMatchSettings = FunctionSpec.publicMutation({
  name: "updateMatchSettings",
  args: () =>
    Schema.Struct({
      ...SessionIdField,
      matchId: Schema.String,
      ...VersionMetadata,
      patch: GameSettingsPatch,
    }),
  returns: () => MatchSnapshot,
});

export default GroupSpec.make()
  .addFunction(createMatch)
  .addFunction(getMatchSnapshotSpec)
  .addFunction(getMatchByCode)
  .addFunction(joinByCode)
  .addFunction(joinMatch)
  .addFunction(startMatch)
  .addFunction(updateMatchSettings);
