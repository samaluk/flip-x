import { FunctionSpec, GroupSpec } from "@confect/core";

import type { disconnect, heartbeat, list, listMatchPresence, syncPlayer } from "./presence";

const heartbeatSpec = FunctionSpec.convexPublicMutation<typeof heartbeat>()("heartbeat");
const listSpec = FunctionSpec.convexPublicQuery<typeof list>()("list");
const disconnectSpec = FunctionSpec.convexPublicMutation<typeof disconnect>()("disconnect");
const syncPlayerSpec = FunctionSpec.convexPublicMutation<typeof syncPlayer>()("syncPlayer");
const listMatchPresenceSpec =
  FunctionSpec.convexPublicQuery<typeof listMatchPresence>()("listMatchPresence");

export const presence = GroupSpec.make("presence")
  .addFunction(heartbeatSpec)
  .addFunction(listSpec)
  .addFunction(disconnectSpec)
  .addFunction(syncPlayerSpec)
  .addFunction(listMatchPresenceSpec);
