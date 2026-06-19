import { RegisteredConvexFunction, RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import settings from "../../settings.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../settings.spec")["default"]>(databaseSchema, settings, RegisteredConvexFunction.make);
