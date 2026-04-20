import { Impl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import { admin } from "./admin.impl";
import { matches } from "./matches.impl";
import { settings } from "./settings.impl";

export default Impl.make(api).pipe(
  Layer.provide(admin),
  Layer.provide(matches),
  Layer.provide(settings),
  Impl.finalize,
);
