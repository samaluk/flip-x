"use client";

import { useExtracted } from "next-intl";

import { translateAppErrorToast } from "./convex-error";
import type { AppError } from "./errors/domain";

export function useTranslateAppErrorToast() {
  const t = useExtracted("Errors");

  // Keep Errors.* literals in extracted catalogs; translateAppErrorToast owns runtime copy.
  void [
    t("Match not found."),
    t("It is not your turn or the turn is invalid."),
    t("That action is not valid right now."),
    t("That target is not allowed."),
    t("Enter a valid host name."),
    t("Choose valid game settings."),
    t("Could not assign a lobby code. Try again."),
    t("No lobby found for that code."),
    t("Enter a valid player name."),
    t("That name is already taken at this table."),
    t("Choose a valid player color."),
    t("That player color is already taken at this table."),
    t("Only the host can do that."),
    t("At least two players need to join before the game can start."),
    t("Join the game first."),
    t("Too many attempts. Please wait a moment and try again."),
    t("This action is not allowed in the current match state."),
    t("The game changed. Refresh and try again."),
    t("Unsupported relationship."),
    t("Unsupported table."),
    t("Invalid confirmation."),
    t("{message}", { message: "" }),
  ];

  return (error: AppError) => translateAppErrorToast(error, t);
}
