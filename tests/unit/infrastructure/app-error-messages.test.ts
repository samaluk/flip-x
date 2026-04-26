import { describe, expect, it } from "vitest";

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
  type AppError,
} from "@/shared/lib/errors/domain";
import { getAppErrorMessage } from "@/shared/lib/errors/messages";

describe("AppError messages", () => {
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
    new UnsupportedTable(),
    new InvalidConfirmation(),
  ];

  it("maps every AppError to a stable message", () => {
    expect(errors.map((error) => [error._tag, getAppErrorMessage(error)])).toMatchInlineSnapshot(`
      [
        [
          "MatchNotFound",
          "Match not found.",
        ],
        [
          "InvalidTurn",
          "It is not your turn.",
        ],
        [
          "InvalidAction",
          "That action is not valid right now.",
        ],
        [
          "InvalidTarget",
          "That target is not valid.",
        ],
        [
          "InvalidHostName",
          "Enter a valid host name.",
        ],
        [
          "LobbyCodeUnavailable",
          "A lobby code could not be created. Try again.",
        ],
        [
          "LobbyNotFound",
          "Lobby not found.",
        ],
        [
          "InvalidPlayerName",
          "Enter a valid player name.",
        ],
        [
          "NameAlreadyTaken",
          "That player name is already taken.",
        ],
        [
          "InvalidPlayerColor",
          "Choose a valid player color.",
        ],
        [
          "PlayerColorAlreadyTaken",
          "That player color is already taken.",
        ],
        [
          "NotHost",
          "Only the host can do that.",
        ],
        [
          "InsufficientPlayers",
          "At least 2 players are required.",
        ],
        [
          "PlayerNotJoined",
          "Join the match before doing that.",
        ],
        [
          "RateLimited",
          "Too many attempts. Try again later.",
        ],
        [
          "InvalidMatchState",
          "The match is not in the right state for that action.",
        ],
        [
          "StaleGameState",
          "The game changed. Refresh and try again.",
        ],
        [
          "UnsupportedRelationship",
          "Unsupported relationship.",
        ],
        [
          "UnsupportedTable",
          "Unsupported table.",
        ],
        [
          "InvalidConfirmation",
          "Invalid confirmation.",
        ],
      ]
    `);
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
});
