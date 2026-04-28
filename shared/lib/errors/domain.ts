import { Data } from "effect";

import { APP_ERROR_WIRE_CODE as W } from "./app-error-wire-code";

export class MatchNotFound extends Data.TaggedError("MatchNotFound")<{
  matchId: string;
}> {
  override readonly message = W.MatchNotFound;
}

export class InvalidTurn extends Data.TaggedError("InvalidTurn")<{}> {
  override readonly message = W.InvalidTurn;
}

export class InvalidAction extends Data.TaggedError("InvalidAction")<{}> {
  override readonly message = W.InvalidAction;
}

export class InvalidTarget extends Data.TaggedError("InvalidTarget")<{}> {
  override readonly message = W.InvalidTarget;
}

export class InvalidHostName extends Data.TaggedError("InvalidHostName")<{}> {
  override readonly message = W.InvalidHostName;
}

export class LobbyCodeUnavailable extends Data.TaggedError("LobbyCodeUnavailable")<{}> {
  override readonly message = W.LobbyCodeUnavailable;
}

export class LobbyNotFound extends Data.TaggedError("LobbyNotFound")<{}> {
  override readonly message = W.LobbyNotFound;
}

export class InvalidPlayerName extends Data.TaggedError("InvalidPlayerName")<{}> {
  override readonly message = W.InvalidPlayerName;
}

export class NameAlreadyTaken extends Data.TaggedError("NameAlreadyTaken")<{
  name: string;
}> {
  override readonly message = W.NameAlreadyTaken;
}

export class InvalidPlayerColor extends Data.TaggedError("InvalidPlayerColor")<{
  colorId: string;
}> {
  override readonly message = W.InvalidPlayerColor;
}

export class PlayerColorAlreadyTaken extends Data.TaggedError("PlayerColorAlreadyTaken")<{
  colorId: string;
}> {
  override readonly message = W.PlayerColorAlreadyTaken;
}

export class NotHost extends Data.TaggedError("NotHost")<{}> {
  override readonly message = W.NotHost;
}

export class InsufficientPlayers extends Data.TaggedError("InsufficientPlayers")<{
  minPlayers: number;
}> {
  override readonly message = W.InsufficientPlayers;
}

export class PlayerNotJoined extends Data.TaggedError("PlayerNotJoined")<{}> {
  override readonly message = W.PlayerNotJoined;
}

export class RateLimited extends Data.TaggedError("RateLimited")<{}> {
  override readonly message = W.RateLimited;
}

export class InvalidMatchState extends Data.TaggedError("InvalidMatchState")<{}> {
  override readonly message = W.InvalidMatchState;
}

export class StaleGameState extends Data.TaggedError("StaleGameState")<{
  expectedVersion: number;
  actualVersion: number;
}> {
  override readonly message = W.StaleGameState;
}

export class UnsupportedRelationship extends Data.TaggedError("UnsupportedRelationship")<{}> {
  override readonly message = W.UnsupportedRelationship;
}

export class UnsupportedTable extends Data.TaggedError("UnsupportedTable")<{
  table: string;
  id: string;
}> {
  override readonly message = W.UnsupportedTable;
}

export class InvalidConfirmation extends Data.TaggedError("InvalidConfirmation")<{}> {
  override readonly message = W.InvalidConfirmation;
}

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
  return W[error._tag];
}
