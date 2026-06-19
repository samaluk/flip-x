import { GenericId } from "@confect/core";

export type TableNames = "idempotencyKeys" | "matches" | "playerSessions" | "players" | "roundEvents" | "roundPlayerStates" | "rounds" | "scoreBreakdowns";

export const Id = <const TableName extends TableNames>(
  tableName: TableName,
) => GenericId.GenericId(tableName);
