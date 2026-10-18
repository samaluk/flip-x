import { ConvexFunctionDefinitions, RegisteredConvexFunction, type RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../settings.impl";

const forward = <Ctx, Args, Returns>(handler: (ctx: Ctx, args: Args) => Promise<Returns>) => (ctx: Ctx, args: Args) => handler(ctx, args);

const definitions = ConvexFunctionDefinitions.buildForGroup<typeof import("../../settings.spec")["default"]>(databaseSchema, groupLayer);

export default {
["getRuntimeConfig"]: RegisteredConvexFunction.register({ ...definitions["getRuntimeConfig"], handler: forward(definitions["getRuntimeConfig"].handler) }),
} as RegisteredFunctions.RegisteredFunctionsForGroupSpec<typeof import("../../settings.spec")["default"]>;
