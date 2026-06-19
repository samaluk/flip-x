import { RegisteredConvexFunction, RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import presence from "../../presence.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../presence.spec")["default"]>(databaseSchema, presence, RegisteredConvexFunction.make);
