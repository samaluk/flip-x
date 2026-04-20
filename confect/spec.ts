import { Spec } from "@confect/core";

import { admin } from "./admin.spec";
import { settings } from "./settings.spec";

export default Spec.make().add(admin).add(settings);
