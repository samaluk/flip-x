import { FunctionImpl, GroupImpl } from "@confect/server";
import { Config, Effect, Layer } from "effect";

import api from "./_generated/api";

const getRuntimeConfig = FunctionImpl.make(api, "settings", "getRuntimeConfig", () =>
  Config.integer("MATCH_TARGET_SCORE").pipe(
    Config.withDefault(200),
    Effect.map((matchTargetScore) => ({ matchTargetScore })),
    Effect.orDie,
  ),
);

export const settings = GroupImpl.make(api, "settings").pipe(Layer.provide(getRuntimeConfig));
