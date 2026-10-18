import { ConvexFunctionDefinitions, RegisteredConvexFunction, type RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../admin.impl";

const forward = <Ctx, Args, Returns>(handler: (ctx: Ctx, args: Args) => Promise<Returns>) => (ctx: Ctx, args: Args) => handler(ctx, args);

const definitions = ConvexFunctionDefinitions.buildForGroup<typeof import("../../admin.spec")["default"]>(databaseSchema, groupLayer);

export default {
["listMatchIds"]: RegisteredConvexFunction.register({ ...definitions["listMatchIds"], handler: forward(definitions["listMatchIds"].handler) }),
["listSessionIds"]: RegisteredConvexFunction.register({ ...definitions["listSessionIds"], handler: forward(definitions["listSessionIds"].handler) }),
["resolveDependents"]: RegisteredConvexFunction.register({ ...definitions["resolveDependents"], handler: forward(definitions["resolveDependents"].handler) }),
["deleteDocument"]: RegisteredConvexFunction.register({ ...definitions["deleteDocument"], handler: forward(definitions["deleteDocument"].handler) }),
["removePresenceRoom"]: RegisteredConvexFunction.register({ ...definitions["removePresenceRoom"], handler: forward(definitions["removePresenceRoom"].handler) }),
["resetRateLimit"]: RegisteredConvexFunction.register({ ...definitions["resetRateLimit"], handler: forward(definitions["resetRateLimit"].handler) }),
["clearAllAppDataViaCli"]: RegisteredConvexFunction.register({ ...definitions["clearAllAppDataViaCli"], handler: forward(definitions["clearAllAppDataViaCli"].handler) }),
} as RegisteredFunctions.RegisteredFunctionsForGroupSpec<typeof import("../../admin.spec")["default"]>;
