import { FunctionSpec, GroupSpec } from "@confect/core";

import * as adminFns from "./admin";

const listMatchIds =
  FunctionSpec.convexInternalQuery<typeof adminFns.listMatchIds>()("listMatchIds");
const listSessionIds =
  FunctionSpec.convexInternalQuery<typeof adminFns.listSessionIds>()("listSessionIds");
const resolveDependents =
  FunctionSpec.convexInternalQuery<typeof adminFns.resolveDependents>()("resolveDependents");
const deleteDocument =
  FunctionSpec.convexInternalMutation<typeof adminFns.deleteDocument>()("deleteDocument");
const clearAllAppDataViaCli =
  FunctionSpec.convexPublicAction<typeof adminFns.clearAllAppDataViaCli>()("clearAllAppDataViaCli");

export const admin = GroupSpec.make("admin")
  .addFunction(listMatchIds)
  .addFunction(listSessionIds)
  .addFunction(resolveDependents)
  .addFunction(deleteDocument)
  .addFunction(clearAllAppDataViaCli);
