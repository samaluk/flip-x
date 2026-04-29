import { Migrations } from "@convex-dev/migrations";

import { components } from "../convex/_generated/api";
import type { DataModel } from "../convex/_generated/dataModel";

const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();
