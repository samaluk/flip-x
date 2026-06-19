import { RegisteredConvexFunction, RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import rounds from "../../rounds.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../rounds.spec")["default"]>(databaseSchema, rounds, RegisteredConvexFunction.make);
