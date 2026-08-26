import {
  APP_ERROR_WIRE_CODE,
  type AppErrorWireCode,
  translateConvexError,
} from "./errors/app-error-wire-code";
import {
  type AppError,
  appErrorWireCode,
  InsufficientPlayers,
  InvalidAction,
  InvalidConfirmation,
  InvalidGameSettings,
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

export type ErrorTranslator = (message: string, values?: Record<string, string | number>) => string;

// fallow-ignore-next-line complexity -- exhaustive AppError wire-code switch; each case calls t() with a distinct literal for extraction.
function translateWireCode(code: AppErrorWireCode, t: ErrorTranslator): string {
  switch (code) {
    case APP_ERROR_WIRE_CODE.MatchNotFound:
      return t("Match not found.");
    case APP_ERROR_WIRE_CODE.InvalidTurn:
      return t("It is not your turn or the turn is invalid.");
    case APP_ERROR_WIRE_CODE.InvalidAction:
      return t("That action is not valid right now.");
    case APP_ERROR_WIRE_CODE.InvalidTarget:
      return t("That target is not allowed.");
    case APP_ERROR_WIRE_CODE.InvalidHostName:
      return t("Enter a valid host name.");
    case APP_ERROR_WIRE_CODE.InvalidGameSettings:
      return t("Choose valid game settings.");
    case APP_ERROR_WIRE_CODE.LobbyCodeUnavailable:
      return t("Could not assign a lobby code. Try again.");
    case APP_ERROR_WIRE_CODE.LobbyNotFound:
      return t("No lobby found for that code.");
    case APP_ERROR_WIRE_CODE.InvalidPlayerName:
      return t("Enter a valid player name.");
    case APP_ERROR_WIRE_CODE.NameAlreadyTaken:
      return t("That name is already taken at this table.");
    case APP_ERROR_WIRE_CODE.InvalidPlayerColor:
      return t("Choose a valid player color.");
    case APP_ERROR_WIRE_CODE.PlayerColorAlreadyTaken:
      return t("That player color is already taken at this table.");
    case APP_ERROR_WIRE_CODE.NotHost:
      return t("Only the host can do that.");
    case APP_ERROR_WIRE_CODE.InsufficientPlayers:
      return t("At least two players need to join before the game can start.");
    case APP_ERROR_WIRE_CODE.PlayerNotJoined:
      return t("Join the game first.");
    case APP_ERROR_WIRE_CODE.RateLimited:
      return t("Too many attempts. Please wait a moment and try again.");
    case APP_ERROR_WIRE_CODE.InvalidMatchState:
      return t("This action is not allowed in the current match state.");
    case APP_ERROR_WIRE_CODE.StaleGameState:
      return t("The game changed. Refresh and try again.");
    case APP_ERROR_WIRE_CODE.UnsupportedRelationship:
      return t("Unsupported relationship.");
    case APP_ERROR_WIRE_CODE.UnsupportedTable:
      return t("Unsupported table.");
    case APP_ERROR_WIRE_CODE.InvalidConfirmation:
      return t("Invalid confirmation.");
    default: {
      const exhaustiveCheck: never = code;
      return exhaustiveCheck;
    }
  }
}

function translateConvexErrorToast(message: string, t: ErrorTranslator): string {
  return translateConvexError(
    message,
    (code) => translateWireCode(code, t),
    (detail) => t("{message}", { message: detail }),
  );
}

export function translateAppErrorToast(error: AppError, t: ErrorTranslator): string {
  return translateConvexErrorToast(appErrorWireCode(error), t);
}

/** AppError class constructors (used from tests via `instanceof`; kept reachable from app entry for static analysis). */
void [
  MatchNotFound,
  InvalidTurn,
  InvalidAction,
  InvalidTarget,
  InvalidHostName,
  InvalidGameSettings,
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
  InvalidConfirmation,
];
