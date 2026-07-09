import { componentsGeneric } from "convex/server";

export type Components = {
  "convexCascadingDeletes": import("@sholajegede/convex-cascading-deletes/_generated/component.js").ComponentApi<"convexCascadingDeletes">;
  "migrations": import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  "posthog": import("@posthog/convex/_generated/component.js").ComponentApi<"posthog">;
  "presence": import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  "rateLimiter": import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};

export const components: Components = componentsGeneric() as any;
