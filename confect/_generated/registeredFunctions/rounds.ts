import { ConvexFunctionDefinitions, RegisteredConvexFunction, type RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../rounds.impl";

const forward = <Ctx, Args, Returns>(handler: (ctx: Ctx, args: Args) => Promise<Returns>) => (ctx: Ctx, args: Args) => handler(ctx, args);

const definitions = ConvexFunctionDefinitions.buildForGroup<typeof import("../../rounds.spec")["default"]>(databaseSchema, groupLayer);

export default {
["startNextRound"]: RegisteredConvexFunction.register({ ...definitions["startNextRound"], handler: forward(definitions["startNextRound"].handler) }),
} as RegisteredFunctions.RegisteredFunctionsForGroupSpec<typeof import("../../rounds.spec")["default"]>;
