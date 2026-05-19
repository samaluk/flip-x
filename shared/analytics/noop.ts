import { Effect, Layer } from "effect";

import { AnalyticsSink } from "./service";

const noopAnalyticsSink = {
  capture: () => Effect.void,
  captureMany: () => Effect.void,
} satisfies Effect.Effect.Success<typeof AnalyticsSink>;

export const noopAnalyticsLayer = Layer.succeed(AnalyticsSink, noopAnalyticsSink);
