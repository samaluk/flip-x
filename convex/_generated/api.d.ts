/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_lobby_code from "../lib/lobby_code.js";
import type * as lib_ruleEngine from "../lib/ruleEngine.js";
import type * as lib_session_functions from "../lib/session_functions.js";
import type * as lib_session_store from "../lib/session_store.js";
import type * as lib_store from "../lib/store.js";
import type * as matches from "../matches.js";
import type * as presence from "../presence.js";
import type * as rounds from "../rounds.js";
import type * as turns from "../turns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/lobby_code": typeof lib_lobby_code;
  "lib/ruleEngine": typeof lib_ruleEngine;
  "lib/session_functions": typeof lib_session_functions;
  "lib/session_store": typeof lib_session_store;
  "lib/store": typeof lib_store;
  matches: typeof matches;
  presence: typeof presence;
  rounds: typeof rounds;
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

export declare const components: {};
