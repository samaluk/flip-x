import { FunctionImpl, GroupImpl } from "@confect/server";
import { Layer } from "effect";

import databaseSchema from "./_generated/schema";
import groupSpec from "./presence.spec";
import * as presenceFns from "./presence";

const heartbeat = FunctionImpl.make(databaseSchema, groupSpec, "heartbeat", presenceFns.heartbeat);
const list = FunctionImpl.make(databaseSchema, groupSpec, "list", presenceFns.list);
const disconnect = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "disconnect",
  presenceFns.disconnect,
);
const syncPlayer = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "syncPlayer",
  presenceFns.syncPlayer,
);
const listMatchPresence = FunctionImpl.make(
  databaseSchema,
  groupSpec,
  "listMatchPresence",
  presenceFns.listMatchPresence,
);

export default GroupImpl.make(databaseSchema, groupSpec).pipe(
  Layer.provide(heartbeat),
  Layer.provide(list),
  Layer.provide(disconnect),
  Layer.provide(syncPlayer),
  Layer.provide(listMatchPresence),
  GroupImpl.finalize,
);
