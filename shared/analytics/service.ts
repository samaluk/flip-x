import { Context, Effect } from "effect";

import type { AnalyticsEvent } from "./types";

export class AnalyticsSink extends Context.Service<
  AnalyticsSink,
  {
    capture: (event: AnalyticsEvent) => Effect.Effect<void>;
    captureMany: (events: readonly AnalyticsEvent[]) => Effect.Effect<void>;
  }
>()("AnalyticsSink") {}

export function captureAnalyticsEvents(events: readonly AnalyticsEvent[]) {
  return Effect.gen(function* () {
    if (events.length === 0) {
      return;
    }

    const analytics = yield* AnalyticsSink;
    yield* analytics.captureMany(events).pipe(Effect.ignore);
  });
}
