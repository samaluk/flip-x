import { Data } from "effect";

export class MatchNotFound extends Data.TaggedError("MatchNotFound")<{
  matchId: string;
}> {}

export class InvalidTurn extends Data.TaggedError("InvalidTurn")<{}> {}

export class InvalidAction extends Data.TaggedError("InvalidAction")<{}> {}

export class InvalidTarget extends Data.TaggedError("InvalidTarget")<{}> {}

export class InvalidHostName extends Data.TaggedError("InvalidHostName")<{}> {}

export class LobbyCodeUnavailable extends Data.TaggedError("LobbyCodeUnavailable")<{}> {}

export class LobbyNotFound extends Data.TaggedError("LobbyNotFound")<{}> {}

export class InvalidPlayerName extends Data.TaggedError("InvalidPlayerName")<{}> {}

export class NameAlreadyTaken extends Data.TaggedError("NameAlreadyTaken")<{
  name: string;
}> {
  override readonly message = "NameAlreadyTaken";
}

export class InvalidPlayerColor extends Data.TaggedError("InvalidPlayerColor")<{
  colorId: string;
}> {}

export class PlayerColorAlreadyTaken extends Data.TaggedError("PlayerColorAlreadyTaken")<{
  colorId: string;
}> {}

export class NotHost extends Data.TaggedError("NotHost")<{}> {}

export class InsufficientPlayers extends Data.TaggedError("InsufficientPlayers")<{
  minPlayers: number;
}> {}

export class PlayerNotJoined extends Data.TaggedError("PlayerNotJoined")<{}> {}

export class RateLimited extends Data.TaggedError("RateLimited")<{}> {}

export class InvalidMatchState extends Data.TaggedError("InvalidMatchState")<{}> {}

export class StaleGameState extends Data.TaggedError("StaleGameState")<{
  expectedVersion: number;
  actualVersion: number;
}> {}

export class UnsupportedRelationship extends Data.TaggedError("UnsupportedRelationship")<{}> {}

export class UnsupportedTable extends Data.TaggedError("UnsupportedTable")<{
  table: string;
  id: string;
}> {}

export class InvalidConfirmation extends Data.TaggedError("InvalidConfirmation")<{}> {}

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
