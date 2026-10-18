import { GenericId } from "@confect/core";
import type { SystemTableNames } from "convex/server";

export type TableNames = "idempotencyKeys" | "matches" | "playerSessions" | "players" | "roundEvents" | "roundPlayerStates" | "rounds" | "scoreBreakdowns";

export type Id<TableName extends TableNames | SystemTableNames> = GenericId.GenericId<TableName>;

export const Id = <const TableName extends TableNames | SystemTableNames>(
  tableName: TableName,
) => GenericId.GenericId(tableName);
