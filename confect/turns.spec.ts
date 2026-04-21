import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { MatchSnapshot } from "./match-snapshot-schema";
import * as turnFns from "./turns";
import { SessionIdField } from "./session";

const takeTurn = FunctionSpec.convexPublicMutation<typeof turnFns.takeTurn>()("takeTurn");
const resolveAction = FunctionSpec.publicMutation({
  name: "resolveAction",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
    targetPlayerId: Schema.String,
  }),
  returns: MatchSnapshot,
});

export const turns = GroupSpec.make("turns").addFunction(takeTurn).addFunction(resolveAction);
