import { CascadingDeletes } from "@sholajegede/convex-cascading-deletes";

import { components } from "../../convex/_generated/api";

export const cascadingDeletes = new CascadingDeletes(components.convexCascadingDeletes, {
  relationships: [
    {
      sourceTable: "players",
      targetTable: "matches",
      indexName: "by_match",
      fieldName: "matchId",
    },
    {
      sourceTable: "rounds",
      targetTable: "matches",
      indexName: "by_match",
      fieldName: "matchId",
    },
    {
      sourceTable: "playerSessions",
      targetTable: "players",
      indexName: "by_player_id",
      fieldName: "playerId",
    },
    {
      sourceTable: "roundPlayerStates",
      targetTable: "rounds",
      indexName: "by_round",
      fieldName: "roundId",
    },
    {
      sourceTable: "roundEvents",
      targetTable: "rounds",
      indexName: "by_round",
      fieldName: "roundId",
    },
    {
      sourceTable: "scoreBreakdowns",
      targetTable: "rounds",
      indexName: "by_round",
      fieldName: "roundId",
    },
  ],
});
