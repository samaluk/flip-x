import { Data } from "effect";

import { APP_ERROR_WIRE_CODE as W } from "./app-error-wire-code";

export class MatchNotFound extends Data.TaggedError("MatchNotFound")<{
  matchId: string;
  message: string;
}> {}

export const matchNotFound = (fields: { matchId: string }): MatchNotFound =>
  new MatchNotFound({ ...fields, message: W.MatchNotFound });

export class InvalidTurn extends Data.TaggedError("InvalidTurn")<{
  message: string;
}> {}

export const invalidTurn = (): InvalidTurn => new InvalidTurn({ message: W.InvalidTurn });

export class InvalidAction extends Data.TaggedError("InvalidAction")<{
  message: string;
}> {}

export const invalidAction = (): InvalidAction => new InvalidAction({ message: W.InvalidAction });

export class InvalidTarget extends Data.TaggedError("InvalidTarget")<{
  message: string;
}> {}

export const invalidTarget = (): InvalidTarget => new InvalidTarget({ message: W.InvalidTarget });

export class InvalidHostName extends Data.TaggedError("InvalidHostName")<{
  message: string;
}> {}

export const invalidHostName = (): InvalidHostName =>
  new InvalidHostName({ message: W.InvalidHostName });

export class LobbyCodeUnavailable extends Data.TaggedError("LobbyCodeUnavailable")<{
  message: string;
}> {}

export const lobbyCodeUnavailable = (): LobbyCodeUnavailable =>
  new LobbyCodeUnavailable({ message: W.LobbyCodeUnavailable });

export class LobbyNotFound extends Data.TaggedError("LobbyNotFound")<{
  message: string;
}> {}

export const lobbyNotFound = (): LobbyNotFound => new LobbyNotFound({ message: W.LobbyNotFound });

export class InvalidPlayerName extends Data.TaggedError("InvalidPlayerName")<{
  message: string;
}> {}

export const invalidPlayerName = (): InvalidPlayerName =>
  new InvalidPlayerName({ message: W.InvalidPlayerName });

export class NameAlreadyTaken extends Data.TaggedError("NameAlreadyTaken")<{
  name: string;
  message: string;
}> {}

export const nameAlreadyTaken = (fields: { name: string }): NameAlreadyTaken =>
  new NameAlreadyTaken({ ...fields, message: W.NameAlreadyTaken });

export class InvalidPlayerColor extends Data.TaggedError("InvalidPlayerColor")<{
  colorId: string;
  message: string;
}> {}

export const invalidPlayerColor = (fields: { colorId: string }): InvalidPlayerColor =>
  new InvalidPlayerColor({ ...fields, message: W.InvalidPlayerColor });

export class PlayerColorAlreadyTaken extends Data.TaggedError("PlayerColorAlreadyTaken")<{
  colorId: string;
  message: string;
}> {}

export const playerColorAlreadyTaken = (fields: {
  colorId: string;
}): PlayerColorAlreadyTaken =>
  new PlayerColorAlreadyTaken({ ...fields, message: W.PlayerColorAlreadyTaken });

export class NotHost extends Data.TaggedError("NotHost")<{
  message: string;
}> {}

export const notHost = (): NotHost => new NotHost({ message: W.NotHost });

export class InsufficientPlayers extends Data.TaggedError("InsufficientPlayers")<{
  minPlayers: number;
  message: string;
}> {}

export const insufficientPlayers = (fields: { minPlayers: number }): InsufficientPlayers =>
  new InsufficientPlayers({ ...fields, message: W.InsufficientPlayers });

export class PlayerNotJoined extends Data.TaggedError("PlayerNotJoined")<{
  message: string;
}> {}

export const playerNotJoined = (): PlayerNotJoined =>
  new PlayerNotJoined({ message: W.PlayerNotJoined });

export class RateLimited extends Data.TaggedError("RateLimited")<{
  message: string;
}> {}

export const rateLimited = (): RateLimited => new RateLimited({ message: W.RateLimited });

export class InvalidMatchState extends Data.TaggedError("InvalidMatchState")<{
  message: string;
}> {}

export const invalidMatchState = (): InvalidMatchState =>
  new InvalidMatchState({ message: W.InvalidMatchState });

export class StaleGameState extends Data.TaggedError("StaleGameState")<{
  expectedVersion: number;
  actualVersion: number;
  message: string;
}> {}

export const staleGameState = (fields: {
  expectedVersion: number;
  actualVersion: number;
}): StaleGameState => new StaleGameState({ ...fields, message: W.StaleGameState });

export class UnsupportedRelationship extends Data.TaggedError("UnsupportedRelationship")<{
  message: string;
}> {}

export const unsupportedRelationship = (): UnsupportedRelationship =>
  new UnsupportedRelationship({ message: W.UnsupportedRelationship });

export class UnsupportedTable extends Data.TaggedError("UnsupportedTable")<{
  table: string;
  id: string;
  message: string;
}> {}

export const unsupportedTable = (fields: {
  table: string;
  id: string;
}): UnsupportedTable => new UnsupportedTable({ ...fields, message: W.UnsupportedTable });

export class InvalidConfirmation extends Data.TaggedError("InvalidConfirmation")<{
  message: string;
}> {}

export const invalidConfirmation = (): InvalidConfirmation =>
  new InvalidConfirmation({ message: W.InvalidConfirmation });

export type AppError =
  | MatchNotFound
  | InvalidTurn
  | InvalidAction
  | InvalidTarget
  | InvalidHostName
  | LobbyCodeUnavailable
  | LobbyNotFound
  | InvalidPlayerName
  | NameAlreadyTaken
  | InvalidPlayerColor
  | PlayerColorAlreadyTaken
  | NotHost
  | InsufficientPlayers
  | PlayerNotJoined
  | RateLimited
  | InvalidMatchState
  | StaleGameState
  | UnsupportedRelationship
  | UnsupportedTable
  | InvalidConfirmation;

export function appErrorWireCode(error: AppError): string {
  return error.message;
}
