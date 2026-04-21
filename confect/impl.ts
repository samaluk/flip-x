import { Impl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import { admin } from "./admin.impl";
import { matches } from "./matches.impl";
import { rounds } from "./rounds.impl";
import { settings } from "./settings.impl";
import { turns } from "./turns.impl";

export default Impl.make(api).pipe(
  Layer.provide(admin),
  Layer.provide(matches),
  Layer.provide(rounds),
  Layer.provide(settings),
  Layer.provide(turns),
  Impl.finalize,
);
