import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { Effect } from "effect";

import { components } from "../../convex/_generated/api";
import { RateLimited } from "../../shared/lib/errors/domain";
import { ExternalComponentFailed } from "../../shared/lib/errors/infrastructure";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createMatch: { kind: "fixed window", rate: 30, period: HOUR },
  joinByCode: { kind: "fixed window", rate: 60, period: HOUR },
  joinMatch: { kind: "token bucket", rate: 30, period: HOUR, capacity: 10 },
  startMatch: { kind: "fixed window", rate: 20, period: MINUTE },
});

export type AppRateLimitName = "createMatch" | "joinByCode" | "joinMatch" | "startMatch";

export function enforceRateLimitEffect(
  ctx: Parameters<typeof rateLimiter.limit>[0],
  name: AppRateLimitName,
  key: string,
) {
  return Effect.gen(function* () {
    const status = yield* Effect.tryPromise({
      try: () => rateLimiter.limit(ctx, name, { key }),
      catch: (cause) => new ExternalComponentFailed({ component: "rateLimiter", cause }),
    });
    if (!status.ok) {
      return yield* new RateLimited();
    }
  });
}
