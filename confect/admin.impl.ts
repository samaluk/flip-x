import { FunctionImpl, GroupImpl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import * as adminFns from "./admin";

const listMatchIds = FunctionImpl.make(api, "admin", "listMatchIds", adminFns.listMatchIds);
const listSessionIds = FunctionImpl.make(api, "admin", "listSessionIds", adminFns.listSessionIds);
const resolveDependents = FunctionImpl.make(
  api,
  "admin",
  "resolveDependents",
  adminFns.resolveDependents,
);
const deleteDocument = FunctionImpl.make(api, "admin", "deleteDocument", adminFns.deleteDocument);
const clearAllAppDataViaCli = FunctionImpl.make(
  api,
  "admin",
  "clearAllAppDataViaCli",
  adminFns.clearAllAppDataViaCli,
);

export const admin = GroupImpl.make(api, "admin").pipe(
  Layer.provide(listMatchIds),
  Layer.provide(listSessionIds),
  Layer.provide(resolveDependents),
  Layer.provide(deleteDocument),
  Layer.provide(clearAllAppDataViaCli),
);
