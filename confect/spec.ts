import { Spec } from "@confect/core";

import { admin } from "./admin.spec";
import { matches } from "./matches.spec";
import { rounds } from "./rounds.spec";
import { settings } from "./settings.spec";
import { turns } from "./turns.spec";

export default Spec.make().add(admin).add(matches).add(rounds).add(settings).add(turns);
