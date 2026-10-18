import { ConvexFunctionDefinitions, RegisteredConvexFunction, type RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../matches.impl";

const forward = <Ctx, Args, Returns>(handler: (ctx: Ctx, args: Args) => Promise<Returns>) => (ctx: Ctx, args: Args) => handler(ctx, args);

const definitions = ConvexFunctionDefinitions.buildForGroup<typeof import("../../matches.spec")["default"]>(databaseSchema, groupLayer);

export default {
["createMatch"]: RegisteredConvexFunction.register({ ...definitions["createMatch"], handler: forward(definitions["createMatch"].handler) }),
["getMatchSnapshot"]: definitions["getMatchSnapshot"].handler,
["getMatchByCode"]: RegisteredConvexFunction.register({ ...definitions["getMatchByCode"], handler: forward(definitions["getMatchByCode"].handler) }),
["joinByCode"]: RegisteredConvexFunction.register({ ...definitions["joinByCode"], handler: forward(definitions["joinByCode"].handler) }),
["joinMatch"]: RegisteredConvexFunction.register({ ...definitions["joinMatch"], handler: forward(definitions["joinMatch"].handler) }),
["startMatch"]: RegisteredConvexFunction.register({ ...definitions["startMatch"], handler: forward(definitions["startMatch"].handler) }),
["updateMatchSettings"]: RegisteredConvexFunction.register({ ...definitions["updateMatchSettings"], handler: forward(definitions["updateMatchSettings"].handler) }),
} as RegisteredFunctions.RegisteredFunctionsForGroupSpec<typeof import("../../matches.spec")["default"]>;
