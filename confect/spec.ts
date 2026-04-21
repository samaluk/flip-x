import { Spec } from "@confect/core";

import { admin } from "./admin.spec";
import { matches } from "./matches.spec";
import { migrations } from "./migrations.spec";
import { presence } from "./presence.spec";
import { rounds } from "./rounds.spec";
import { settings } from "./settings.spec";
import { turns } from "./turns.spec";

export default Spec.make()
  .add(admin)
  .add(matches)
  .add(migrations)
  .add(presence)
  .add(rounds)
  .add(settings)
  .add(turns);
