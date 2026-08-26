/**
 * Stable strings carried on domain errors via `.message` (Convex/client boundary)
 * and localized via the `Errors` namespace in `messages/*.po`.
 * Exhaustiveness vs `AppError` is enforced in unit tests.
 */
export const APP_ERROR_WIRE_CODE = {
  MatchNotFound: "MATCH_NOT_FOUND",
  InvalidTurn: "INVALID_TURN",
  InvalidAction: "INVALID_ACTION",
  InvalidTarget: "INVALID_TARGET",
  InvalidHostName: "INVALID_HOST_NAME",
  InvalidGameSettings: "INVALID_GAME_SETTINGS",
  LobbyCodeUnavailable: "LOBBY_CODE_UNAVAILABLE",
  LobbyNotFound: "LOBBY_NOT_FOUND",
  InvalidPlayerName: "INVALID_PLAYER_NAME",
  NameAlreadyTaken: "NAME_ALREADY_TAKEN",
  InvalidPlayerColor: "INVALID_PLAYER_COLOR",
  PlayerColorAlreadyTaken: "PLAYER_COLOR_ALREADY_TAKEN",
  NotHost: "NOT_HOST",
  InsufficientPlayers: "INSUFFICIENT_PLAYERS",
  PlayerNotJoined: "PLAYER_NOT_JOINED",
  RateLimited: "RATE_LIMITED",
  InvalidMatchState: "INVALID_MATCH_STATE",
  StaleGameState: "STALE_GAME_STATE",
  UnsupportedRelationship: "UNSUPPORTED_RELATIONSHIP",
  UnsupportedTable: "UNSUPPORTED_TABLE",
  InvalidConfirmation: "INVALID_CONFIRMATION",
} as const;

const CANONICAL_CODES = new Set<string>(Object.values(APP_ERROR_WIRE_CODE));
export type AppErrorWireCode = (typeof APP_ERROR_WIRE_CODE)[keyof typeof APP_ERROR_WIRE_CODE];
export type ErrorCodeTranslator = (key: AppErrorWireCode) => string;

function isWireCodeMessage(message: string): message is AppErrorWireCode {
  return CANONICAL_CODES.has(message);
}

/**
 * Maps Convex/client error strings to localized copy. Accepts canonical wire codes
 * such as `MATCH_NOT_FOUND` on `AppError.message`.
 */
export function translateConvexError(
  message: string,
  t: ErrorCodeTranslator,
  translateGeneric: (message: string) => string,
): string {
  if (isWireCodeMessage(message)) {
    return t(message);
  }
  return translateGeneric(message);
}
