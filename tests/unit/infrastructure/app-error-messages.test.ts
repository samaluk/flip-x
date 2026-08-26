import { describe, expect, it } from "vitest";

import { APP_ERROR_WIRE_CODE, translateConvexError } from "@/shared/lib/errors/app-error-wire-code";
import { translateAppErrorToast } from "@/shared/lib/convex-error";
import {
  insufficientPlayers,
  invalidAction,
  InvalidConfirmation,
  invalidHostName,
  invalidMatchState,
  invalidPlayerColor,
  invalidPlayerName,
  invalidTarget,
  invalidTurn,
  lobbyCodeUnavailable,
  lobbyNotFound,
  matchNotFound,
  nameAlreadyTaken,
  notHost,
  playerColorAlreadyTaken,
  playerNotJoined,
  rateLimited,
  staleGameState,
  unsupportedRelationship,
  unsupportedTable,
  appErrorWireCode,
  type AppError,
} from "@/shared/lib/errors/domain";

import { en, es } from "@/messages/catalogs";

function mockErrorsT(key: string, values?: Record<string, string | number>): string {
  return values !== undefined && key === "generic" ? `generic:${values.message}` : key;
}

function mockGenericErrorT(message: string): string {
  return `generic:${message}`;
}

function mockExtractedErrorsT(message: string, values?: Record<string, string | number>): string {
  return values !== undefined ? `${message}:${JSON.stringify(values)}` : message;
}

describe("AppError wire codes and Errors.* messages", () => {
  const errors: AppError[] = [
    matchNotFound({ matchId: "match-1" }),
    invalidTurn(),
    invalidAction(),
    invalidTarget(),
    invalidHostName(),
    lobbyCodeUnavailable(),
    lobbyNotFound(),
    invalidPlayerName(),
    nameAlreadyTaken({ name: "Sam" }),
    invalidPlayerColor({ colorId: "pink" }),
    playerColorAlreadyTaken({ colorId: "blue" }),
    notHost(),
    insufficientPlayers({ minPlayers: 2 }),
    playerNotJoined(),
    rateLimited(),
    invalidMatchState(),
    staleGameState({ expectedVersion: 1, actualVersion: 2 }),
    unsupportedRelationship(),
    unsupportedTable({ table: "x", id: "y" }),
    new InvalidConfirmation({ message: APP_ERROR_WIRE_CODE.InvalidConfirmation }),
  ];

  it("maps every AppError tag to a stable wire code on .message", () => {
    for (const error of errors) {
      expect(error.message).toBe(APP_ERROR_WIRE_CODE[error._tag]);
      expect(appErrorWireCode(error)).toBe(APP_ERROR_WIRE_CODE[error._tag]);
    }
  });

  const expectedErrorMessages = [
    "Match not found.",
    "It is not your turn or the turn is invalid.",
    "That action is not valid right now.",
    "That target is not allowed.",
    "Enter a valid host name.",
    "Choose valid game settings.",
    "Could not assign a lobby code. Try again.",
    "No lobby found for that code.",
    "Enter a valid player name.",
    "That name is already taken at this table.",
    "Choose a valid player color.",
    "That player color is already taken at this table.",
    "Only the host can do that.",
    "At least two players need to join before the game can start.",
    "Join the game first.",
    "Too many attempts. Please wait a moment and try again.",
    "This action is not allowed in the current match state.",
    "The game changed. Refresh and try again.",
    "Unsupported relationship.",
    "Unsupported table.",
    "Invalid confirmation.",
    "Game action failed.",
    "{message}",
  ] as const;

  it("defines every error toast message in PO catalogs", () => {
    const englishMessages = Object.values(en.Errors);
    const spanishMessages = Object.values(es.Errors);
    for (const message of expectedErrorMessages) {
      expect(englishMessages).toContain(message);
    }
    expect(englishMessages).toHaveLength(expectedErrorMessages.length);
    expect(spanishMessages).toHaveLength(expectedErrorMessages.length);
    expect(spanishMessages.every((translation) => translation.length > 0)).toBe(true);
  });

  it("keeps tags and payload fields stable", () => {
    expect(matchNotFound({ matchId: "m1" })).toMatchObject({
      _tag: "MatchNotFound",
      matchId: "m1",
    });
    expect(nameAlreadyTaken({ name: "Ada" })).toMatchObject({
      _tag: "NameAlreadyTaken",
      name: "Ada",
    });
    expect(invalidPlayerColor({ colorId: "gold" })).toMatchObject({
      _tag: "InvalidPlayerColor",
      colorId: "gold",
    });
    expect(playerColorAlreadyTaken({ colorId: "cyan" })).toMatchObject({
      _tag: "PlayerColorAlreadyTaken",
      colorId: "cyan",
    });
    expect(insufficientPlayers({ minPlayers: 3 })).toMatchObject({
      _tag: "InsufficientPlayers",
      minPlayers: 3,
    });
    expect(staleGameState({ expectedVersion: 7, actualVersion: 8 })).toMatchObject({
      _tag: "StaleGameState",
      expectedVersion: 7,
      actualVersion: 8,
    });
  });

  it("translateAppErrorToast maps wire codes to extracted English messages", () => {
    expect(translateAppErrorToast(matchNotFound({ matchId: "m1" }), mockExtractedErrorsT)).toBe(
      "Match not found.",
    );
    expect(translateAppErrorToast(nameAlreadyTaken({ name: "Sam" }), mockExtractedErrorsT)).toBe(
      "That name is already taken at this table.",
    );
    expect(
      translateAppErrorToast(insufficientPlayers({ minPlayers: 2 }), mockExtractedErrorsT),
    ).toBe("At least two players need to join before the game can start.");
  });

  it("translateConvexError resolves canonical codes and legacy _tag names", () => {
    expect(translateConvexError("MATCH_NOT_FOUND", mockErrorsT, mockGenericErrorT)).toBe(
      "MATCH_NOT_FOUND",
    );
    expect(translateConvexError("MatchNotFound", mockErrorsT, mockGenericErrorT)).toBe(
      "MATCH_NOT_FOUND",
    );
    expect(translateConvexError("unknown-code", mockErrorsT, mockGenericErrorT)).toBe(
      "generic:unknown-code",
    );
  });
});
