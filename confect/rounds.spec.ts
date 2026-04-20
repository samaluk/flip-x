import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { MatchSnapshot } from "./match-snapshot-schema";
import { SessionIdField } from "./session";

const startNextRound = FunctionSpec.publicMutation({
  name: "startNextRound",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
  }),
  returns: MatchSnapshot,
});

export const rounds = GroupSpec.make("rounds").addFunction(startNextRound);
