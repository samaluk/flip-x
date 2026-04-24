import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { DeterministicStartOptions } from "./deterministic-schema";
import { MatchSnapshot } from "./match-snapshot-schema";
import { SessionIdField } from "./session";

const CommandMetadata = {
  expectedVersion: Schema.Number,
  idempotencyKey: Schema.String,
};

const startNextRound = FunctionSpec.publicMutation({
  name: "startNextRound",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
    ...CommandMetadata,
    deterministicStart: Schema.optional(DeterministicStartOptions),
  }),
  returns: MatchSnapshot,
});

export const rounds = GroupSpec.make("rounds").addFunction(startNextRound);
