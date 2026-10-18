import { RegisteredFunctions } from "@confect/server";
import databaseSchema from "../schema";
import groupLayer from "../../migrations.impl";

export default RegisteredFunctions.buildForGroup<typeof import("../../migrations.spec")["default"]>(databaseSchema, groupLayer);
