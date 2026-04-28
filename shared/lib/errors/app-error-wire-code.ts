/**
 * Stable strings carried on domain errors via `.message` (Convex/client boundary)
 * and used as keys under `Errors` in `messages/*.json`.
 * Exhaustiveness vs `AppError` is enforced in unit tests.
 */
export const APP_ERROR_WIRE_CODE = {
  MatchNotFound: "MATCH_NOT_FOUND",
  InvalidTurn: "INVALID_TURN",
  InvalidAction: "INVALID_ACTION",
  InvalidTarget: "INVALID_TARGET",
  InvalidHostName: "INVALID_HOST_NAME",
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

/**
 * Maps Convex/client error strings to localized copy. Accepts canonical wire codes
 * (`MATCH_NOT_FOUND`) and legacy `_tag` names (`MatchNotFound`) from older payloads.
 */
export function translateConvexError(
  message: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (CANONICAL_CODES.has(message)) {
    return t(message);
  }
  if (message in APP_ERROR_WIRE_CODE) {
    return t(APP_ERROR_WIRE_CODE[message as keyof typeof APP_ERROR_WIRE_CODE]);
  }
  return t("generic", { message });
}
