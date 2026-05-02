import type { SessionId } from "convex-helpers/server/sessions";
import { v } from "convex/values";
import { Effect, Option } from "effect";
import type { Card } from "../game/logic/card-types";
import { generateLobbyCode } from "../shared/lib/lobby-code";
import { enforceRateLimit } from "./lib/rate_limiter";
import { queryWithSession, toSessionId } from "./lib/session_functions";
import { setPlayerSessionWithServices } from "./lib/session_store";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { getPlayersByMatchWithReader, getViewerPlayerIdWithReader } from "./lib/store";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "../shared/lib/player-colors";
import {
  invalidHostName,
  invalidMatchState,
  invalidPlayerColor,
  invalidPlayerName,
  lobbyCodeUnavailable,
  lobbyNotFound,
  matchNotFound,
  nameAlreadyTaken,
  notHost,
  playerColorAlreadyTaken,
  staleGameState,
} from "../shared/lib/errors/domain";
import { runGameCommand } from "../game/application/run-command";
import { buildSnapshot, getLatestRound } from "../game/infrastructure/snapshot-store";
import {
  DEFAULT_GAME_SETTINGS,
  gameSettingsEqual,
  normalizeAndValidateGameSettings,
  settingsFromMatch,
  type GameSettings,
} from "../game/logic/game-settings";
import {
  DatabaseReader as DatabaseReaderService,
  DatabaseWriter as DatabaseWriterService,
} from "./_generated/services";

type MatchReadCtx = QueryCtx | MutationCtx;

function snapshotForMatchSession(
  ctx: MatchReadCtx,
  matchId: Id<"matches">,
  match: Doc<"matches">,
  sessionId: SessionId,
) {
  return Effect.gen(function* () {
    const round = yield* Effect.promise(() => getLatestRound(ctx, matchId));
    return yield* Effect.promise(() => buildSnapshot(ctx, match, round, sessionId));
  });
}

function snapshotAfterMatchReload(
  ctx: MatchReadCtx,
  reader: Effect.Effect.Success<typeof DatabaseReaderService>,
  matchId: Id<"matches">,
  sessionId: SessionId,
) {
  return Effect.gen(function* () {
    const nextMatch = yield* reader.table("matches").get(matchId);

    if (!nextMatch) {
      return yield* matchNotFound({ matchId: String(matchId) });
    }

    return yield* snapshotForMatchSession(ctx, matchId, nextMatch, sessionId);
  });
}

function resolveUniqueLobbyCodeAttempt(
  lookupMatchByLobbyCode: (lobbyCode: string) => Effect.Effect<Doc<"matches"> | null, unknown>,
  initialLobbyCode: string,
) {
  return Effect.gen(function* () {
    let lobbyCode = initialLobbyCode;
    let existing = yield* lookupMatchByLobbyCode(lobbyCode);
    let attempts = 0;

    while (existing && attempts < 10) {
      lobbyCode = generateLobbyCode();
      existing = yield* lookupMatchByLobbyCode(lobbyCode);
      attempts += 1;
    }

    return { lobbyCode, existing } as const;
  });
}

function readMatchByLobbyCode(reader: Effect.Effect.Success<typeof DatabaseReaderService>, lobbyCode: string) {
  return reader
    .table("matches")
    .index("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
    .first()
    .pipe(Effect.map(Option.getOrNull));
}

function generateUniqueLobbyCode(
  lookupMatchByLobbyCode: (lobbyCode: string) => Effect.Effect<Doc<"matches"> | null, unknown>,
) {
  return Effect.gen(function* () {
    const { lobbyCode, existing } = yield* resolveUniqueLobbyCodeAttempt(
      lookupMatchByLobbyCode,
      generateLobbyCode(),
    );

    if (existing) {
      return yield* lobbyCodeUnavailable();
    }

    return lobbyCode;
  });
}

function getSetupMatchByLobbyCode(
  lookupMatchByLobbyCode: (lobbyCode: string) => Effect.Effect<Doc<"matches"> | null, unknown>,
  lobbyCode: string,
) {
  return Effect.gen(function* () {
    const match = yield* lookupMatchByLobbyCode(lobbyCode);

    if (!match || match.status !== "setup") {
      return yield* lobbyNotFound();
    }

    return match;
  });
}

export function getMatchByCode(ctx: QueryCtx, lobbyCode: string) {
  const normalized = lobbyCode.trim().toUpperCase();
  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;

    if (normalized.length !== 4) {
      return null;
    }

    const match = yield* readMatchByLobbyCode(reader, normalized);

    if (!match || match.status !== "setup") {
      return null;
    }

    const players = yield* getPlayersByMatchWithReader(reader, match._id);

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
      status: match.status,
      usedColorIds: players
        .map((player) => player.colorId)
        .filter((colorId): colorId is string => typeof colorId === "string"),
    };
  });
}

export function createMatchForSession(
  ctx: MutationCtx,
  args: { hostName: string; hostColorId?: string; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;
    const writer = yield* DatabaseWriterService;

    yield* enforceRateLimit(ctx, "createMatch", String(args.sessionId));

    const hostName = args.hostName.trim();

    if (!hostName || hostName.length > 20) {
      return yield* invalidHostName();
    }

    const hostColorId = yield* normalizePlayerColorId(args.hostColorId, []);

    const timestamp = Date.now();
    const lobbyCode = yield* generateUniqueLobbyCode((code) => readMatchByLobbyCode(reader, code));
    const matchId = yield* writer.table("matches").insert({
        status: "setup",
        lobbyCode,
        targetScore: DEFAULT_GAME_SETTINGS.targetScore,
        maxNumberCardValue: DEFAULT_GAME_SETTINGS.maxNumberCardValue,
        currentRoundNumber: 0,
        dealerSeat: 0,
        version: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

    const hostPlayerId = yield* writer.table("players").insert({
        matchId,
        displayName: hostName,
        colorId: hostColorId,
        seatIndex: 0,
        totalScore: 0,
        hasWon: false,
      });

    yield* setPlayerSessionWithServices(reader, writer, sessionId, hostPlayerId);
    yield* writer.table("matches").patch(matchId, { hostPlayerId });

    const match = yield* reader.table("matches").get(matchId);
    if (!match) {
      return yield* matchNotFound({ matchId: String(matchId) });
    }

    return yield* Effect.promise(() => buildSnapshot(ctx, match, null, sessionId));
  });
}

export function joinByCodeForSession(
  ctx: MutationCtx,
  args: { lobbyCode: string; sessionId: string },
) {
  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;

    yield* enforceRateLimit(ctx, "joinByCode", String(args.sessionId));

    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      return yield* lobbyNotFound();
    }

    const match = yield* getSetupMatchByLobbyCode(
      (lobbyCode) => readMatchByLobbyCode(reader, lobbyCode),
      normalized,
    );

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
    };
  });
}

export const getMatchSnapshot = queryWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => await Effect.runPromise(loadMatchSnapshotForSession(ctx, args)),
});

function loadMatchSnapshotForSession(
  ctx: QueryCtx,
  args: { matchId: Id<"matches">; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    // queryWithSession executes as a plain Convex query, so Confect services are
    // not layered here; use the raw query ctx directly at this boundary.
    const match = yield* Effect.promise(() => ctx.db.get(args.matchId));

    if (!match) {
      return null;
    }

    return yield* snapshotForMatchSession(ctx, args.matchId, match, sessionId);
  });
}

export function joinMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; playerColorId?: string; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;
    const writer = yield* DatabaseWriterService;

    yield* enforceRateLimit(ctx, "joinMatch", String(args.sessionId));

    const match = yield* reader.table("matches").get(args.matchId);

    if (!match || match.status !== "setup") {
      return yield* matchNotFound({ matchId: String(args.matchId) });
    }

    const playerName = args.playerName.trim();
    if (!playerName || playerName.length > 20) {
      return yield* invalidPlayerName();
    }

    const players = yield* getPlayersByMatchWithReader(reader, args.matchId);
    const existingViewerPlayerId = yield* getViewerPlayerIdWithReader(reader, args.matchId, sessionId);
    const takenColorIds = players
      .filter((player) => !existingViewerPlayerId || player._id !== existingViewerPlayerId)
      .map((player) => player.colorId)
      .filter((colorId): colorId is PlayerColorId => isPlayerColorId(colorId ?? ""));
    const playerColorId = yield* normalizePlayerColorId(args.playerColorId, takenColorIds);

    if (existingViewerPlayerId) {
      const existingViewerPlayer = players.find((player) => player._id === existingViewerPlayerId);
      if (!existingViewerPlayer) {
        return yield* matchNotFound({ matchId: String(args.matchId) });
      }

      if (
        existingViewerPlayer.displayName.toLowerCase() !== playerName.toLowerCase() &&
        players.some((player) => player.displayName.toLowerCase() === playerName.toLowerCase())
      ) {
        return yield* nameAlreadyTaken({ name: playerName });
      }

      yield* writer
        .table("players")
        .patch(existingViewerPlayerId, { displayName: playerName, colorId: playerColorId });

      return yield* snapshotAfterMatchReload(ctx, reader, args.matchId, sessionId);
    }

    const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
    if (existingNames.has(playerName.toLowerCase())) {
      return yield* nameAlreadyTaken({ name: playerName });
    }

    const nextSeat =
      players.length === 0 ? 0 : Math.max(...players.map((player) => player.seatIndex)) + 1;
    const playerId = yield* writer.table("players").insert({
        matchId: args.matchId,
        displayName: playerName,
        colorId: playerColorId,
        seatIndex: nextSeat,
        totalScore: 0,
        hasWon: false,
      });

    yield* setPlayerSessionWithServices(reader, writer, sessionId, playerId);

    return yield* snapshotForMatchSession(ctx, args.matchId, match, sessionId);
  });
}

function normalizePlayerColorId(colorId: string | undefined, takenColorIds: string[]) {
  return Effect.gen(function* () {
    if (!colorId) {
      return firstAvailablePlayerColorId(takenColorIds);
    }

    if (!isPlayerColorId(colorId)) {
      return yield* invalidPlayerColor({ colorId });
    }

    if (takenColorIds.includes(colorId)) {
      return yield* playerColorAlreadyTaken({ colorId });
    }

    return colorId;
  });
}

export function startMatchForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    yield* enforceRateLimit(ctx, "startMatch", String(args.sessionId));

    return yield* runGameCommand(ctx, {
      matchId: args.matchId,
      sessionId,
      command: {
        type: "START_MATCH",
        expectedVersion: args.expectedVersion,
        idempotencyKey: args.idempotencyKey,
        deterministicStart: args.deterministicStart,
      },
    });
  });
}

export function updateMatchSettingsForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    patch: Partial<GameSettings>;
  },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;
    const writer = yield* DatabaseWriterService;

    const match = yield* reader.table("matches").get(args.matchId);

    if (!match) {
      return yield* matchNotFound({ matchId: String(args.matchId) });
    }

    if (match.status !== "setup") {
      return yield* invalidMatchState();
    }

    const viewerPlayerId = yield* getViewerPlayerIdWithReader(reader, args.matchId, sessionId);

    if (!viewerPlayerId || match.hostPlayerId !== viewerPlayerId) {
      return yield* notHost();
    }

    if (match.version !== args.expectedVersion) {
      return yield* staleGameState({
        expectedVersion: args.expectedVersion,
        actualVersion: match.version,
      });
    }

    const currentSettings = settingsFromMatch(match);
    const nextSettings = normalizeAndValidateGameSettings({
      ...currentSettings,
      ...args.patch,
    });

    if (gameSettingsEqual(currentSettings, nextSettings)) {
      return yield* snapshotForMatchSession(ctx, args.matchId, match, sessionId);
    }

    yield* writer.table("matches").patch(args.matchId, {
      targetScore: nextSettings.targetScore,
      maxNumberCardValue: nextSettings.maxNumberCardValue,
      version: match.version + 1,
      updatedAt: Date.now(),
    });

    return yield* snapshotAfterMatchReload(ctx, reader, args.matchId, sessionId);
  });
}
