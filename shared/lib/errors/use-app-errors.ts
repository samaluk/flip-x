"use client";

import { useExtracted } from "next-intl";

import { APP_ERROR_WIRE_CODE, type AppErrorWireCode } from "./app-error-wire-code";
import { translateAppErrorMessage } from "./app-error-messages";
import type { AppError } from "./domain";

export function useAppErrors() {
  const t = useExtracted("Errors");

  const wireMessages: Record<AppErrorWireCode, string> = {
    [APP_ERROR_WIRE_CODE.MatchNotFound]: t("Match not found."),
    [APP_ERROR_WIRE_CODE.InvalidTurn]: t("It is not your turn or the turn is invalid."),
    [APP_ERROR_WIRE_CODE.InvalidAction]: t("That action is not valid right now."),
    [APP_ERROR_WIRE_CODE.InvalidTarget]: t("That target is not allowed."),
    [APP_ERROR_WIRE_CODE.InvalidHostName]: t("Enter a valid host name."),
    [APP_ERROR_WIRE_CODE.InvalidGameSettings]: t("Choose valid game settings."),
    [APP_ERROR_WIRE_CODE.LobbyCodeUnavailable]: t("Could not assign a lobby code. Try again."),
    [APP_ERROR_WIRE_CODE.LobbyNotFound]: t("No lobby found for that code."),
    [APP_ERROR_WIRE_CODE.InvalidPlayerName]: t("Enter a valid player name."),
    [APP_ERROR_WIRE_CODE.NameAlreadyTaken]: t("That name is already taken at this table."),
    [APP_ERROR_WIRE_CODE.InvalidPlayerColor]: t("Choose a valid player color."),
    [APP_ERROR_WIRE_CODE.PlayerColorAlreadyTaken]: t(
      "That player color is already taken at this table.",
    ),
    [APP_ERROR_WIRE_CODE.NotHost]: t("Only the host can do that."),
    [APP_ERROR_WIRE_CODE.InsufficientPlayers]: t(
      "At least two players need to join before the game can start.",
    ),
    [APP_ERROR_WIRE_CODE.PlayerNotJoined]: t("Join the game first."),
    [APP_ERROR_WIRE_CODE.RateLimited]: t("Too many attempts. Please wait a moment and try again."),
    [APP_ERROR_WIRE_CODE.InvalidMatchState]: t(
      "This action is not allowed in the current match state.",
    ),
    [APP_ERROR_WIRE_CODE.StaleGameState]: t("The game changed. Refresh and try again."),
    [APP_ERROR_WIRE_CODE.UnsupportedRelationship]: t("Unsupported relationship."),
    [APP_ERROR_WIRE_CODE.UnsupportedTable]: t("Unsupported table."),
    [APP_ERROR_WIRE_CODE.InvalidConfirmation]: t("Invalid confirmation."),
  };

  return {
    translateToast: (error: AppError) =>
      translateAppErrorMessage(error, (code) => wireMessages[code], t),
    matchNotFoundTitle: t("Match not found."),
    gameActionFailed: t("Game action failed."),
  };
}
