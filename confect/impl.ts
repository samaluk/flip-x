import { Impl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import { settings } from "./settings.impl";

export default Impl.make(api).pipe(Layer.provide(settings), Impl.finalize);
