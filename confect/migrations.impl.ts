import { FunctionImpl, GroupImpl } from "@confect/server";
import { Layer } from "effect";

import databaseSchema from "./_generated/schema";
import groupSpec from "./migrations.spec";
import * as migrationFns from "./migrations";

const run = FunctionImpl.make(databaseSchema, groupSpec, "run", migrationFns.run);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(run),
  GroupImpl.finalize,
);
