/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as matches from "../matches.js";
import type * as migrations from "../migrations.js";
import type * as posthog from "../posthog.js";
import type * as presence from "../presence.js";
import type * as rounds from "../rounds.js";
import type * as settings from "../settings.js";
import type * as turns from "../turns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  matches: typeof matches;
  migrations: typeof migrations;
  posthog: typeof posthog;
  presence: typeof presence;
  rounds: typeof rounds;
  settings: typeof settings;
  turns: typeof turns;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  posthog: import("@posthog/convex/_generated/component.js").ComponentApi<"posthog">;
  convexCascadingDeletes: import("@sholajegede/convex-cascading-deletes/_generated/component.js").ComponentApi<"convexCascadingDeletes">;
};
