import { describe, expect, it } from "vitest";

import {
  APP_ERROR_WIRE_CODE,
  translateConvexError,
} from "@/shared/lib/errors/app-error-wire-code";
import {
  InsufficientPlayers,
  InvalidAction,
  InvalidConfirmation,
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
    new MatchNotFound({ matchId: "match-1" }),
    new InvalidTurn(),
    new InvalidAction(),
    new InvalidTarget(),
    new InvalidHostName(),
    new LobbyCodeUnavailable(),
    new LobbyNotFound(),
    new InvalidPlayerName(),
    new NameAlreadyTaken({ name: "Sam" }),
    new InvalidPlayerColor({ colorId: "pink" }),
    new PlayerColorAlreadyTaken({ colorId: "blue" }),
    new NotHost(),
    new InsufficientPlayers({ minPlayers: 2 }),
    new PlayerNotJoined(),
    new RateLimited(),
    new InvalidMatchState(),
    new StaleGameState({ expectedVersion: 1, actualVersion: 2 }),
    new UnsupportedRelationship(),
    new UnsupportedTable({ table: "x", id: "y" }),
    new InvalidConfirmation(),
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
    expect(new MatchNotFound({ matchId: "m1" })).toMatchObject({
      _tag: "MatchNotFound",
      matchId: "m1",
    });
    expect(new NameAlreadyTaken({ name: "Ada" })).toMatchObject({
      _tag: "NameAlreadyTaken",
      name: "Ada",
    });
    expect(new InvalidPlayerColor({ colorId: "gold" })).toMatchObject({
      _tag: "InvalidPlayerColor",
      colorId: "gold",
    });
    expect(new PlayerColorAlreadyTaken({ colorId: "cyan" })).toMatchObject({
      _tag: "PlayerColorAlreadyTaken",
      colorId: "cyan",
    });
    expect(new InsufficientPlayers({ minPlayers: 3 })).toMatchObject({
      _tag: "InsufficientPlayers",
      minPlayers: 3,
    });
    expect(new StaleGameState({ expectedVersion: 7, actualVersion: 8 })).toMatchObject({
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
