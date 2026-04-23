import { Data } from "effect";

export class MatchNotFound extends Data.TaggedError("MatchNotFound")<{
  matchId: string;
}> {
  get message() {
    return this._tag;
  }
}

export class InvalidTurn extends Data.TaggedError("InvalidTurn")<{
  _tag: "InvalidTurn";
}> {}

export class InvalidAction extends Data.TaggedError("InvalidAction")<{
  _tag: "InvalidAction";
}> {}

export class InvalidTarget extends Data.TaggedError("InvalidTarget")<{
  _tag: "InvalidTarget";
}> {}

export class InvalidHostName extends Data.TaggedError("InvalidHostName")<{
  _tag: "InvalidHostName";
}> {}

export class LobbyCodeUnavailable extends Data.TaggedError("LobbyCodeUnavailable")<{
  _tag: "LobbyCodeUnavailable";
}> {}

export class LobbyNotFound extends Data.TaggedError("LobbyNotFound")<{
  _tag: "LobbyNotFound";
}> {}

export class InvalidPlayerName extends Data.TaggedError("InvalidPlayerName")<{
  _tag: "InvalidPlayerName";
}> {}

export class NameAlreadyTaken extends Data.TaggedError("NameAlreadyTaken")<{
  name: string;
}> {
  get message() {
    return this._tag;
  }
}

export class NotHost extends Data.TaggedError("NotHost")<{
  _tag: "NotHost";
}> {}

export class InsufficientPlayers extends Data.TaggedError("InsufficientPlayers")<{
  minPlayers: number;
}> {
  get message() {
    return this._tag;
  }
}

export class PlayerNotJoined extends Data.TaggedError("PlayerNotJoined")<{
  _tag: "PlayerNotJoined";
}> {}

export class RateLimited extends Data.TaggedError("RateLimited")<{
  _tag: "RateLimited";
}> {}

export class InvalidMatchState extends Data.TaggedError("InvalidMatchState")<{
  _tag: "InvalidMatchState";
}> {}

export class UnsupportedRelationship extends Data.TaggedError("UnsupportedRelationship")<{
  _tag: "UnsupportedRelationship";
}> {}

export class UnsupportedTable extends Data.TaggedError("UnsupportedTable")<{
  _tag: "UnsupportedTable";
}> {}

export class InvalidConfirmation extends Data.TaggedError("InvalidConfirmation")<{
  _tag: "InvalidConfirmation";
}> {}

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
  | NotHost
  | InsufficientPlayers
  | PlayerNotJoined
  | RateLimited
  | InvalidMatchState
  | UnsupportedRelationship
  | UnsupportedTable
  | InvalidConfirmation;
