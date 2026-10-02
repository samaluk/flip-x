import { Effect, Layer } from "effect";

import { env, type MutationCtx } from "../../convex/_generated/server";
import { posthog } from "../../confect/lib/posthog";
import { AnalyticsSink } from "./service";

export function makePostHogConvexAnalyticsLayer(ctx: MutationCtx): Layer.Layer<AnalyticsSink> {
  const enabled = Boolean(env.POSTHOG_PROJECT_TOKEN);

  return Layer.succeed(AnalyticsSink, {
    capture: (event) =>
      enabled
        ? Effect.promise(() =>
            posthog.capture(ctx, {
              distinctId: event.distinctId,
              event: event.event,
              properties: event.properties,
            }),
          )
        : Effect.void,
    captureMany: (events) =>
      enabled
        ? Effect.forEach(events, (event) =>
            Effect.promise(() =>
              posthog.capture(ctx, {
                distinctId: event.distinctId,
                event: event.event,
                properties: event.properties,
              }),
            ),
          ).pipe(Effect.asVoid)
        : Effect.void,
  });
}
