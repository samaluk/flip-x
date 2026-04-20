import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

import * as matchFns from "./matches";

const MatchLookupResult = Schema.Struct({
  matchId: Schema.String,
  lobbyCode: Schema.String,
  status: Schema.Literal("setup"),
});

const getMatchByCode = FunctionSpec.publicQuery({
  name: "getMatchByCode",
  args: Schema.Struct({
    lobbyCode: Schema.String,
  }),
  returns: Schema.Union(Schema.Null, MatchLookupResult),
});

const createMatch = FunctionSpec.convexPublicMutation<typeof matchFns.createMatch>()("createMatch");
const getMatchSnapshot = FunctionSpec.convexPublicQuery<typeof matchFns.getMatchSnapshot>()(
  "getMatchSnapshot",
);
const joinByCode = FunctionSpec.convexPublicMutation<typeof matchFns.joinByCode>()("joinByCode");
const joinMatch = FunctionSpec.convexPublicMutation<typeof matchFns.joinMatch>()("joinMatch");
const startMatch = FunctionSpec.convexPublicMutation<typeof matchFns.startMatch>()("startMatch");

export const matches = GroupSpec.make("matches")
  .addFunction(createMatch)
  .addFunction(getMatchSnapshot)
  .addFunction(getMatchByCode)
  .addFunction(joinByCode)
  .addFunction(joinMatch)
  .addFunction(startMatch);
