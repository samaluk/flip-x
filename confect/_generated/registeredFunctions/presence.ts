import { RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../presence.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../presence.spec")["default"]>(databaseSchema, groupLayer);
