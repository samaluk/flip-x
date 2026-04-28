import type { SessionId } from "convex-helpers/server/sessions";
import { v } from "convex/values";
import { Effect } from "effect";
import type { Card } from "../game/logic/card-types";
import { generateLobbyCode } from "../shared/lib/lobby-code";
import { enforceRateLimit } from "./lib/rate_limiter";
import { mutationWithSession, queryWithSession, toSessionId } from "./lib/session_functions";
import { setPlayerSession } from "./lib/session_store";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { getPlayersByMatch, getViewerPlayerId } from "./lib/store";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "../shared/lib/player-colors";
import {
  invalidHostName,
  invalidPlayerColor,
  invalidPlayerName,
  lobbyCodeUnavailable,
  lobbyNotFound,
  matchNotFound,
  nameAlreadyTaken,
  playerColorAlreadyTaken,
} from "../shared/lib/errors/domain";
import { runGameCommand } from "../game/application/run-command";
import { buildSnapshot, getLatestRound } from "../game/infrastructure/snapshot-store";

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

function findMatchByLobbyCode(ctx: MutationCtx | QueryCtx, lobbyCode: string) {
  return ctx.db
    .query("matches")
    .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
    .first();
}

function resolveUniqueLobbyCodeAttempt(ctx: MutationCtx, initialLobbyCode: string) {
  return Effect.gen(function* () {
    let lobbyCode = initialLobbyCode;
    let existing = yield* Effect.promise(() => findMatchByLobbyCode(ctx, lobbyCode));
    let attempts = 0;

    while (existing && attempts < 10) {
      lobbyCode = generateLobbyCode();
      existing = yield* Effect.promise(() => findMatchByLobbyCode(ctx, lobbyCode));
      attempts += 1;
    }

    return { lobbyCode, existing } as const;
  });
}

function generateUniqueLobbyCode(ctx: MutationCtx) {
  return Effect.gen(function* () {
    const { lobbyCode, existing } = yield* resolveUniqueLobbyCodeAttempt(
      ctx,
      generateLobbyCode(),
    );

    if (existing) {
      return yield* lobbyCodeUnavailable();
    }

    return lobbyCode;
  });
}

function getSetupMatchByLobbyCode(ctx: MutationCtx, lobbyCode: string) {
  return Effect.gen(function* () {
    const match = yield* Effect.promise(() => findMatchByLobbyCode(ctx, lobbyCode));

    if (!match || match.status !== "setup") {
      return yield* lobbyNotFound();
    }

    return match;
  });
}

export function getMatchByCode(ctx: QueryCtx, lobbyCode: string) {
  const normalized = lobbyCode.trim().toUpperCase();
  return Effect.gen(function* () {
    if (normalized.length !== 4) {
      return null;
    }

    const match = yield* Effect.promise(() => findMatchByLobbyCode(ctx, normalized));

    if (!match || match.status !== "setup") {
      return null;
    }

    const players = yield* getPlayersByMatch(ctx, match._id);

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
    yield* enforceRateLimit(ctx, "createMatch", String(args.sessionId));

    const hostName = args.hostName.trim();

    if (!hostName || hostName.length > 20) {
      return yield* invalidHostName();
    }

    const hostColorId = yield* normalizePlayerColorId(args.hostColorId, []);

    const timestamp = Date.now();
    const lobbyCode = yield* generateUniqueLobbyCode(ctx);
    const matchId = yield* Effect.promise(() =>
      ctx.db.insert("matches", {
        status: "setup",
        lobbyCode,
        targetScore: 200,
        currentRoundNumber: 0,
        dealerSeat: 0,
        version: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );

    const hostPlayerId = yield* Effect.promise(() =>
      ctx.db.insert("players", {
        matchId,
        displayName: hostName,
        colorId: hostColorId,
        seatIndex: 0,
        totalScore: 0,
        hasWon: false,
      }),
    );

    yield* setPlayerSession(ctx, sessionId, hostPlayerId);
    yield* Effect.promise(() => ctx.db.patch(matchId, { hostPlayerId }));

    const match = yield* Effect.promise(() => ctx.db.get(matchId));
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
    yield* enforceRateLimit(ctx, "joinByCode", String(args.sessionId));

    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      return yield* lobbyNotFound();
    }

    const match = yield* getSetupMatchByLobbyCode(ctx, normalized);

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
    };
  });
}

export const createMatch = mutationWithSession({
  args: {
    hostName: v.string(),
    hostColorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await Effect.runPromise(createMatchForSession(ctx, args)),
});

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
    const match = yield* Effect.promise(() => ctx.db.get(args.matchId));

    if (!match) {
      return null;
    }

    return yield* snapshotForMatchSession(ctx, args.matchId, match, sessionId);
  });
}

export const joinByCode = mutationWithSession({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => await Effect.runPromise(joinByCodeForSession(ctx, args)),
});

export function joinMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; playerColorId?: string; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    yield* enforceRateLimit(ctx, "joinMatch", String(args.sessionId));

    const match = yield* Effect.promise(() => ctx.db.get(args.matchId));

    if (!match || match.status !== "setup") {
      return yield* matchNotFound({ matchId: String(args.matchId) });
    }

    const playerName = args.playerName.trim();
    if (!playerName || playerName.length > 20) {
      return yield* invalidPlayerName();
    }

    const players = yield* getPlayersByMatch(ctx, args.matchId);
    const existingViewerPlayerId = yield* getViewerPlayerId(ctx, args.matchId, sessionId);
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

      yield* Effect.promise(() =>
        ctx.db.patch(existingViewerPlayerId, { displayName: playerName, colorId: playerColorId }),
      );
      const nextMatch = yield* Effect.promise(() => ctx.db.get(args.matchId));

      if (!nextMatch) {
        return yield* matchNotFound({ matchId: String(args.matchId) });
      }

      return yield* snapshotForMatchSession(ctx, args.matchId, nextMatch, sessionId);
    }

    const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
    if (existingNames.has(playerName.toLowerCase())) {
      return yield* nameAlreadyTaken({ name: playerName });
    }

    const nextSeat =
      players.length === 0 ? 0 : Math.max(...players.map((player) => player.seatIndex)) + 1;
    const playerId = yield* Effect.promise(() =>
      ctx.db.insert("players", {
        matchId: args.matchId,
        displayName: playerName,
        colorId: playerColorId,
        seatIndex: nextSeat,
        totalScore: 0,
        hasWon: false,
      }),
    );

    yield* setPlayerSession(ctx, sessionId, playerId);

    return yield* snapshotForMatchSession(ctx, args.matchId, match, sessionId);
  });
}

export const joinMatch = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerName: v.string(),
    playerColorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await Effect.runPromise(joinMatchForSession(ctx, args)),
});

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
