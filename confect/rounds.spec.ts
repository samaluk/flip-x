import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

import { DeterministicStartOptions } from "./deterministic-schema";
import { MatchSnapshot } from "./match-snapshot-schema";
import { SessionIdField } from "./session";

const CommandMetadata = {
  expectedVersion: Schema.Number,
  idempotencyKey: Schema.String,
};

const startNextRound = FunctionSpec.publicMutation({
  name: "startNextRound",
  args: () =>
    Schema.Struct({
      ...SessionIdField,
      matchId: Schema.String,
      ...CommandMetadata,
      deterministicStart: Schema.optional(DeterministicStartOptions),
    }),
  returns: () => MatchSnapshot,
});

export default GroupSpec.make().addFunction(startNextRound);
