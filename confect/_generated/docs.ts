import type { Document } from "@confect/server";
import type schemaDefinition from "./schema";

export type IdempotencyKeysDoc = Document.Document<typeof schemaDefinition, "idempotencyKeys">;
export type MatchesDoc = Document.Document<typeof schemaDefinition, "matches">;
export type PlayerSessionsDoc = Document.Document<typeof schemaDefinition, "playerSessions">;
export type PlayersDoc = Document.Document<typeof schemaDefinition, "players">;
export type RoundEventsDoc = Document.Document<typeof schemaDefinition, "roundEvents">;
export type RoundPlayerStatesDoc = Document.Document<typeof schemaDefinition, "roundPlayerStates">;
export type RoundsDoc = Document.Document<typeof schemaDefinition, "rounds">;
export type ScoreBreakdownsDoc = Document.Document<typeof schemaDefinition, "scoreBreakdowns">;

export interface Docs {
  idempotencyKeys: IdempotencyKeysDoc;
  matches: MatchesDoc;
  playerSessions: PlayerSessionsDoc;
  players: PlayersDoc;
  roundEvents: RoundEventsDoc;
  roundPlayerStates: RoundPlayerStatesDoc;
  rounds: RoundsDoc;
  scoreBreakdowns: ScoreBreakdownsDoc;
}
