const CONVEX_ERROR_CODES = new Set([
  "INVALID_MATCH_STATE",
  "MATCH_NOT_FOUND",
  "INVALID_TURN",
  "INVALID_ACTION",
  "INVALID_TARGET",
  "INVALID_HOST_NAME",
  "LOBBY_CODE_UNAVAILABLE",
  "LOBBY_NOT_FOUND",
  "INVALID_PLAYER_NAME",
  "NAME_ALREADY_TAKEN",
  "INVALID_PLAYER_COLOR",
  "PLAYER_COLOR_ALREADY_TAKEN",
  "InvalidPlayerColor",
  "PlayerColorAlreadyTaken",
  "NOT_HOST",
  "INSUFFICIENT_PLAYERS",
  "PLAYER_NOT_JOINED",
  "RATE_LIMITED",
]);

export function translateConvexError(
  message: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (CONVEX_ERROR_CODES.has(message)) {
    return t(message);
  }
  return t("generic", { message });
}
