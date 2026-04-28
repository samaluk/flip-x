import { translateConvexError } from "./errors/app-error-wire-code";
import {
  InsufficientPlayers,
  InvalidAction,
  InvalidConfirmation,
  InvalidHostName,
  InvalidMatchState,
  InvalidPlayerColor,
  InvalidPlayerName,
  InvalidTarget,
  InvalidTurn,
  LobbyCodeUnavailable,
  LobbyNotFound,
  MatchNotFound,
  NameAlreadyTaken,
  NotHost,
  PlayerColorAlreadyTaken,
  PlayerNotJoined,
  RateLimited,
  StaleGameState,
  UnsupportedRelationship,
  UnsupportedTable,
} from "./errors/domain";

export { translateConvexError };

/** AppError class constructors (used from tests via `instanceof`; kept reachable from app entry for static analysis). */
void (
  MatchNotFound,
  InvalidTurn,
  InvalidAction,
  InvalidTarget,
  InvalidHostName,
  LobbyCodeUnavailable,
  LobbyNotFound,
  InvalidPlayerName,
  NameAlreadyTaken,
  InvalidPlayerColor,
  PlayerColorAlreadyTaken,
  NotHost,
  InsufficientPlayers,
  PlayerNotJoined,
  RateLimited,
  InvalidMatchState,
  StaleGameState,
  UnsupportedRelationship,
  UnsupportedTable,
  InvalidConfirmation
);
