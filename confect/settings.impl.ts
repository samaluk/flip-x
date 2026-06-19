import { FunctionImpl, GroupImpl } from "@confect/server";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import databaseSchema from "./_generated/schema";
import groupSpec from "./settings.spec";

const getRuntimeConfig = FunctionImpl.make(databaseSchema, groupSpec, "getRuntimeConfig", () =>
  Config.integer("MATCH_TARGET_SCORE").pipe(
    Config.withDefault(200),
    Effect.map((matchTargetScore) => ({ matchTargetScore })),
    Effect.orDie,
  ),
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(getRuntimeConfig),
  GroupImpl.finalize,
);
