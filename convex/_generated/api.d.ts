/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as mutations_broadcasts from "../mutations/broadcasts.js";
import type * as mutations_encounters from "../mutations/encounters.js";
import type * as mutations_patternWalks from "../mutations/patternWalks.js";
import type * as mutations_pings from "../mutations/pings.js";
import type * as mutations_presence from "../mutations/presence.js";
import type * as mutations_trails from "../mutations/trails.js";
import type * as mutations_windowMoments from "../mutations/windowMoments.js";
import type * as queries_broadcasts from "../queries/broadcasts.js";
import type * as queries_encounters from "../queries/encounters.js";
import type * as queries_networkStats from "../queries/networkStats.js";
import type * as queries_patternWalks from "../queries/patternWalks.js";
import type * as queries_presence from "../queries/presence.js";
import type * as queries_temporal from "../queries/temporal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cleanup: typeof cleanup;
  crons: typeof crons;
  "mutations/broadcasts": typeof mutations_broadcasts;
  "mutations/encounters": typeof mutations_encounters;
  "mutations/patternWalks": typeof mutations_patternWalks;
  "mutations/pings": typeof mutations_pings;
  "mutations/presence": typeof mutations_presence;
  "mutations/trails": typeof mutations_trails;
  "mutations/windowMoments": typeof mutations_windowMoments;
  "queries/broadcasts": typeof queries_broadcasts;
  "queries/encounters": typeof queries_encounters;
  "queries/networkStats": typeof queries_networkStats;
  "queries/patternWalks": typeof queries_patternWalks;
  "queries/presence": typeof queries_presence;
  "queries/temporal": typeof queries_temporal;
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
