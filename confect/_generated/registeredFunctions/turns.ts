import { ConvexFunctionDefinitions, RegisteredConvexFunction, type RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../turns.impl";

const forward = <Ctx, Args, Returns>(handler: (ctx: Ctx, args: Args) => Promise<Returns>) => (ctx: Ctx, args: Args) => handler(ctx, args);

const definitions = ConvexFunctionDefinitions.buildForGroup<typeof import("../../turns.spec")["default"]>(databaseSchema, groupLayer);

export default {
["takeTurn"]: RegisteredConvexFunction.register({ ...definitions["takeTurn"], handler: forward(definitions["takeTurn"].handler) }),
["resolveAction"]: RegisteredConvexFunction.register({ ...definitions["resolveAction"], handler: forward(definitions["resolveAction"].handler) }),
} as RegisteredFunctions.RegisteredFunctionsForGroupSpec<typeof import("../../turns.spec")["default"]>;
