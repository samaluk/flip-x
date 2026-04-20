import { Impl } from "@confect/server";

import api from "./_generated/api";

export default Impl.make(api).pipe(Impl.finalize);
