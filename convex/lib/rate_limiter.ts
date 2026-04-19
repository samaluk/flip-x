import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "../_generated/api";
import { RateLimited } from "../../shared/lib/errors/domain";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createMatch: { kind: "fixed window", rate: 30, period: HOUR },
  joinByCode: { kind: "fixed window", rate: 60, period: HOUR },
  joinMatch: { kind: "token bucket", rate: 30, period: HOUR, capacity: 10 },
  startMatch: { kind: "fixed window", rate: 20, period: MINUTE },
});

export type AppRateLimitName = "createMatch" | "joinByCode" | "joinMatch" | "startMatch";

export async function enforceRateLimit(
  ctx: Parameters<typeof rateLimiter.limit>[0],
  name: AppRateLimitName,
  key: string,
) {
  const status = await rateLimiter.limit(ctx, name, { key });
  if (!status.ok) {
    throw new RateLimited();
  }
}
