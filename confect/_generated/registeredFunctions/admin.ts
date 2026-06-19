import { RegisteredConvexFunction, RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import admin from "../../admin.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../admin.spec")["default"]>(databaseSchema, admin, RegisteredConvexFunction.make);
