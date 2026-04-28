import { describe, expect, it } from "vitest";

import {
  APP_ERROR_WIRE_CODE,
  translateConvexError,
} from "@/shared/lib/errors/app-error-wire-code";
import {
  insufficientPlayers,
  invalidAction,
  invalidConfirmation,
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

import en from "../../../messages/en.json";
import es from "../../../messages/es.json";

function mockErrorsT(key: string, values?: Record<string, string | number>): string {
  return values !== undefined && key === "generic" ? `generic:${values.message}` : key;
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
    invalidConfirmation(),
  ];

  it("maps every AppError tag to a stable wire code on .message", () => {
    for (const error of errors) {
      expect(error.message).toBe(APP_ERROR_WIRE_CODE[error._tag]);
      expect(appErrorWireCode(error)).toBe(APP_ERROR_WIRE_CODE[error._tag]);
    }
  });

  it("defines every wire code under Errors in en.json and es.json", () => {
    for (const code of Object.values(APP_ERROR_WIRE_CODE)) {
      expect(en.Errors).toHaveProperty(code);
      expect(es.Errors).toHaveProperty(code);
      expect(typeof en.Errors[code as keyof typeof en.Errors]).toBe("string");
      expect(typeof es.Errors[code as keyof typeof es.Errors]).toBe("string");
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

  it("translateConvexError resolves canonical codes and legacy _tag names", () => {
    expect(translateConvexError("MATCH_NOT_FOUND", mockErrorsT)).toBe("MATCH_NOT_FOUND");
    expect(translateConvexError("MatchNotFound", mockErrorsT)).toBe("MATCH_NOT_FOUND");
    expect(translateConvexError("unknown-code", mockErrorsT)).toBe("generic:unknown-code");
  });
});
