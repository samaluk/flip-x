import { FunctionSpec, GroupSpec } from "@confect/core";
import * as Schema from "effect/Schema";

const getRuntimeConfig = FunctionSpec.publicQuery({
  name: "getRuntimeConfig",
  args: () => Schema.Struct({}),
  returns: () =>
    Schema.Struct({
      matchTargetScore: Schema.Number,
    }),
});

export default GroupSpec.make().addFunction(getRuntimeConfig);
