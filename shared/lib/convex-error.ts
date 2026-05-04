import { translateConvexError } from "./errors/app-error-wire-code";
import {
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

export function translateConvexErrorToast(message: string, tErrors: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- next-intl translator from useTranslations("Errors")
  const t = tErrors as (key: string, values?: { message: string }) => string;
  return translateConvexError(
    message,
    (key) => t(key),
    (detail) =>
      t("generic", {
        message: detail,
      }),
  );
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
