import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import { MatchSnapshot } from "./match-snapshot-schema";
import { SessionIdField } from "./session";

const CommandMetadata = {
  expectedVersion: Schema.Number,
  idempotencyKey: Schema.String,
};

const takeTurn = FunctionSpec.publicMutation({
  name: "takeTurn",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
    ...CommandMetadata,
    action: Schema.Literal("hit", "stay"),
  }),
  returns: MatchSnapshot,
});
const resolveAction = FunctionSpec.publicMutation({
  name: "resolveAction",
  args: Schema.Struct({
    ...SessionIdField,
    matchId: Schema.String,
    ...CommandMetadata,
    targetPlayerId: Schema.String,
  }),
  returns: MatchSnapshot,
});

export const turns = GroupSpec.make("turns").addFunction(takeTurn).addFunction(resolveAction);
