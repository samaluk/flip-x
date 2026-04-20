import { FunctionSpec, GroupSpec } from "@confect/core";
import { Schema } from "effect";

const getRuntimeConfig = FunctionSpec.publicQuery({
  name: "getRuntimeConfig",
  args: Schema.Struct({}),
  returns: Schema.Struct({
    matchTargetScore: Schema.Number,
  }),
});

export const settings = GroupSpec.make("settings").addFunction(getRuntimeConfig);
