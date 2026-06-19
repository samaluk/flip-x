import { RegisteredConvexFunction, RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import matches from "../../matches.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../matches.spec")["default"]>(databaseSchema, matches, RegisteredConvexFunction.make);
