import type * as Effect from "effect/Effect";

import type { MutationCtx, QueryCtx } from "../../convex/_generated/server";
import {
  DatabaseReader as DatabaseReaderService,
  DatabaseWriter as DatabaseWriterService,
} from "../_generated/services";

export type DatabaseReader = Effect.Effect.Success<typeof DatabaseReaderService>;
export type DatabaseWriter = Effect.Effect.Success<typeof DatabaseWriterService>;
export type Ctx = QueryCtx | MutationCtx;
