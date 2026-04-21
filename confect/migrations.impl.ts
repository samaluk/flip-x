import { FunctionImpl, GroupImpl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import * as migrationFns from "./migrations";

const run = FunctionImpl.make(api, "migrations", "run", migrationFns.run);

export const migrations = GroupImpl.make(api, "migrations").pipe(Layer.provide(run));
