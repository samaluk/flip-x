/** @vitest-environment jsdom */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { APP_ERROR_WIRE_CODE, translateConvexError } from "@/shared/lib/errors/app-error-wire-code";
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
import { useAppErrors } from "@/shared/lib/errors/use-app-errors";
import { IntlEnProvider } from "@/tests/test-intl";

function mockErrorsT(key: string, values?: Record<string, string | number>): string {
  return values !== undefined && key === "generic" ? `generic:${values.message}` : key;
}

function mockGenericErrorT(message: string): string {
  return `generic:${message}`;
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

  it("useAppErrors maps wire codes to extracted English messages", () => {
    const { result } = renderHook(() => useAppErrors(), { wrapper: IntlEnProvider });

    expect(result.current.translateToast(matchNotFound({ matchId: "m1" }))).toBe(
      "Match not found.",
    );
    expect(result.current.translateToast(nameAlreadyTaken({ name: "Sam" }))).toBe(
      "That name is already taken at this table.",
    );
    expect(result.current.translateToast(insufficientPlayers({ minPlayers: 2 }))).toBe(
      "At least two players need to join before the game can start.",
    );
    expect(result.current.matchNotFoundTitle).toBe("Match not found.");
    expect(result.current.gameActionFailed).toBe("Game action failed.");
  });

  it("translateConvexError resolves canonical wire codes and falls back for unknown strings", () => {
    expect(translateConvexError("MATCH_NOT_FOUND", mockErrorsT, mockGenericErrorT)).toBe(
      "MATCH_NOT_FOUND",
    );
    expect(translateConvexError("unknown-code", mockErrorsT, mockGenericErrorT)).toBe(
      "generic:unknown-code",
    );
  });
});
