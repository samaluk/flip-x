import { Spec } from "@confect/core";

import { admin } from "./admin.spec";
import { matches } from "./matches.spec";
import { settings } from "./settings.spec";

export default Spec.make().add(admin).add(matches).add(settings);
