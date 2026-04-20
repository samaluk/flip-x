import { FunctionImpl, GroupImpl } from "@confect/server";
import { Effect, Layer } from "effect";

import api from "./_generated/api";
import { QueryCtx } from "./_generated/services";
import * as matchFns from "./matches";

const createMatch = FunctionImpl.make(api, "matches", "createMatch", matchFns.createMatch);
const getMatchSnapshot = FunctionImpl.make(api, "matches", "getMatchSnapshot", matchFns.getMatchSnapshot);
const getMatchByCode = FunctionImpl.make(api, "matches", "getMatchByCode", ({ lobbyCode }) =>
  Effect.gen(function* () {
    const ctx = (yield* QueryCtx) as unknown as Parameters<typeof matchFns.lookupSetupMatchByCode>[0];
    return yield* Effect.promise(() => matchFns.lookupSetupMatchByCode(ctx, lobbyCode));
  }).pipe(Effect.orDie),
);
const joinByCode = FunctionImpl.make(api, "matches", "joinByCode", matchFns.joinByCode);
const joinMatch = FunctionImpl.make(api, "matches", "joinMatch", matchFns.joinMatch);
const startMatch = FunctionImpl.make(api, "matches", "startMatch", matchFns.startMatch);

export const matches = GroupImpl.make(api, "matches").pipe(
  Layer.provide(createMatch),
  Layer.provide(getMatchSnapshot),
  Layer.provide(getMatchByCode),
  Layer.provide(joinByCode),
  Layer.provide(joinMatch),
  Layer.provide(startMatch),
);
