import { FunctionSpec, GroupSpec } from "@confect/core";

import type { run } from "./migrations";

const runMigrations = FunctionSpec.convexInternalMutation<typeof run>()("run");

export const migrations = GroupSpec.make("migrations").addFunction(runMigrations);
