import { RegisteredConvexFunction, RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import turns from "../../turns.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../turns.spec")["default"]>(databaseSchema, turns, RegisteredConvexFunction.make);
