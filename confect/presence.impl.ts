import { FunctionImpl, GroupImpl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import * as presenceFns from "./presence";

const heartbeat = FunctionImpl.make(api, "presence", "heartbeat", presenceFns.heartbeat);
const list = FunctionImpl.make(api, "presence", "list", presenceFns.list);
const disconnect = FunctionImpl.make(api, "presence", "disconnect", presenceFns.disconnect);
const syncPlayer = FunctionImpl.make(api, "presence", "syncPlayer", presenceFns.syncPlayer);
const listMatchPresence = FunctionImpl.make(
  api,
  "presence",
  "listMatchPresence",
  presenceFns.listMatchPresence,
);

export const presence = GroupImpl.make(api, "presence").pipe(
  Layer.provide(heartbeat),
  Layer.provide(list),
  Layer.provide(disconnect),
  Layer.provide(syncPlayer),
  Layer.provide(listMatchPresence),
);
