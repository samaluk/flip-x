import { v } from "convex/values";
import type { SessionId } from "convex-helpers/server/sessions";
import { Effect } from "effect";
import { getOneFrom } from "convex-helpers/server/relationships";

import type { Card } from "../game/logic/card-types";
import { generateLobbyCode } from "../shared/lib/lobby-code";
import { enforceRateLimitEffect } from "./lib/rate_limiter";
import { mutationWithSession, queryWithSession } from "./lib/session_functions";
import { setPlayerSession } from "./lib/session_store";
import type { Id } from "../convex/_generated/dataModel";
import { getPlayersByMatch, getViewerPlayerId } from "./lib/store";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "../shared/lib/player-colors";
import {
  InvalidHostName,
  InvalidPlayerColor,
  InvalidPlayerName,
  LobbyCodeUnavailable,
  LobbyNotFound,
  MatchNotFound,
  NameAlreadyTaken,
  PlayerColorAlreadyTaken,
} from "../shared/lib/errors/domain";
import { runGameCommandEffect } from "../game/application/run-command";
import { buildSnapshot, getLatestRound } from "../game/infrastructure/snapshot-store";

function generateUniqueLobbyCodeEffect(ctx: MutationCtx) {
  let lobbyCode = generateLobbyCode();
  return Effect.gen(function* () {
    let existing = yield* Effect.promise(() =>
      ctx.db
        .query("matches")
        .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
        .first(),
    );
    let attempts = 0;

    while (existing && attempts < 10) {
      lobbyCode = generateLobbyCode();
      existing = yield* Effect.promise(() =>
        ctx.db
          .query("matches")
          .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
          .first(),
      );
      attempts += 1;
    }

    if (existing) {
      return yield* new LobbyCodeUnavailable();
    }

    return lobbyCode;
  });
}

function getSetupMatchByLobbyCodeEffect(ctx: MutationCtx, lobbyCode: string) {
  return Effect.gen(function* () {
    const match = yield* Effect.promise(() =>
      ctx.db
        .query("matches")
        .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", lobbyCode))
        .first(),
    );

    if (!match || match.status !== "setup") {
      return yield* new LobbyNotFound();
    }

    return match;
  });
}

export function getMatchByCodeEffect(ctx: QueryCtx, lobbyCode: string) {
  const normalized = lobbyCode.trim().toUpperCase();
  return Effect.gen(function* () {
    if (normalized.length !== 4) {
      return null;
    }

    const match = yield* Effect.promise(() =>
      ctx.db
      .query("matches")
        .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", normalized))
        .first(),
    );

    if (!match || match.status !== "setup") {
      return null;
    }

    const players = yield* Effect.promise(() => getPlayersByMatch(ctx, match._id));

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

export async function createMatchForSession(
  ctx: MutationCtx,
  args: { hostName: string; hostColorId?: string; sessionId: string },
) {
  return await Effect.runPromise(createMatchForSessionEffect(ctx, args));
}

export function createMatchForSessionEffect(
  ctx: MutationCtx,
  args: { hostName: string; hostColorId?: string; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  return Effect.gen(function* () {
    yield* enforceRateLimitEffect(ctx, "createMatch", String(args.sessionId));

    const hostName = args.hostName.trim();

    if (!hostName || hostName.length > 20) {
      return yield* new InvalidHostName();
    }

    const hostColorId = normalizePlayerColorId(args.hostColorId, []);

    const timestamp = Date.now();
    const lobbyCode = yield* generateUniqueLobbyCodeEffect(ctx);
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

    yield* Effect.promise(() => setPlayerSession(ctx, sessionId, hostPlayerId));
    yield* Effect.promise(() => ctx.db.patch(matchId, { hostPlayerId }));

    const match = yield* Effect.promise(() => ctx.db.get(matchId));
    if (!match) {
      return yield* new MatchNotFound({ matchId: String(matchId) });
    }

    return yield* Effect.promise(() => buildSnapshot(ctx, match, null, sessionId));
  });
}

export async function joinByCodeForSession(
  ctx: MutationCtx,
  args: { lobbyCode: string; sessionId: string },
) {
  return await Effect.runPromise(joinByCodeForSessionEffect(ctx, args));
}

export function joinByCodeForSessionEffect(
  ctx: MutationCtx,
  args: { lobbyCode: string; sessionId: string },
) {
  return Effect.gen(function* () {
    yield* enforceRateLimitEffect(ctx, "joinByCode", String(args.sessionId));

    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      return yield* new LobbyNotFound();
    }

    const match = yield* getSetupMatchByLobbyCodeEffect(ctx, normalized);

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
  handler: async (ctx, args) => await createMatchForSession(ctx, args),
});

export const getCurrentPlayer = queryWithSession({
  args: {},
  handler: async (ctx, args) => await Effect.runPromise(getCurrentPlayerEffect(ctx, args)),
});

export function getCurrentPlayerEffect(ctx: QueryCtx, args: { sessionId: string }) {
  return Effect.gen(function* () {
    const playerSession = yield* Effect.promise(() =>
      getOneFrom(ctx.db, "playerSessions", "by_session_id", args.sessionId, "sessionId"),
    );

    if (!playerSession) {
      return null;
    }

    const player = yield* Effect.promise(() => ctx.db.get(playerSession.playerId));
    if (!player) {
      return null;
    }

    return {
      displayName: player.displayName,
    };
  });
}

export const getMatchSnapshot = queryWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => await Effect.runPromise(getMatchSnapshotForSessionEffect(ctx, args)),
});

export function getMatchSnapshotForSessionEffect(
  ctx: QueryCtx,
  args: { matchId: Id<"matches">; sessionId: string },
) {
  return Effect.gen(function* () {
    const match = yield* Effect.promise(() => ctx.db.get(args.matchId));

    if (!match) {
      return null;
    }

    const round = yield* Effect.promise(() => getLatestRound(ctx, args.matchId));
    return yield* Effect.promise(() => buildSnapshot(ctx, match, round, args.sessionId));
  });
}

export const joinByCode = mutationWithSession({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => await joinByCodeForSession(ctx, args),
});

export async function joinMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; playerColorId?: string; sessionId: string },
) {
  return await Effect.runPromise(joinMatchForSessionEffect(ctx, args));
}

export function joinMatchForSessionEffect(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; playerColorId?: string; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  return Effect.gen(function* () {
    yield* enforceRateLimitEffect(ctx, "joinMatch", String(args.sessionId));

    const match = yield* Effect.promise(() => ctx.db.get(args.matchId));

    if (!match || match.status !== "setup") {
      return yield* new MatchNotFound({ matchId: String(args.matchId) });
    }

    const playerName = args.playerName.trim();
    if (!playerName || playerName.length > 20) {
      return yield* new InvalidPlayerName();
    }

    const players = yield* Effect.promise(() => getPlayersByMatch(ctx, args.matchId));
    const existingViewerPlayerId = yield* Effect.promise(() =>
      getViewerPlayerId(ctx, args.matchId, sessionId),
    );
    const takenColorIds = players
      .filter((player) => !existingViewerPlayerId || player._id !== existingViewerPlayerId)
      .map((player) => player.colorId)
      .filter((colorId): colorId is PlayerColorId => isPlayerColorId(colorId ?? ""));
    const playerColorId = normalizePlayerColorId(args.playerColorId, takenColorIds);

    if (existingViewerPlayerId) {
      const existingViewerPlayer = players.find((player) => player._id === existingViewerPlayerId);
      if (!existingViewerPlayer) {
        return yield* new MatchNotFound({ matchId: String(args.matchId) });
      }

      if (
        existingViewerPlayer.displayName.toLowerCase() !== playerName.toLowerCase() &&
        players.some((player) => player.displayName.toLowerCase() === playerName.toLowerCase())
      ) {
        return yield* new NameAlreadyTaken({ name: playerName });
      }

      yield* Effect.promise(() =>
        ctx.db.patch(existingViewerPlayerId, { displayName: playerName, colorId: playerColorId }),
      );
      const round = yield* Effect.promise(() => getLatestRound(ctx, args.matchId));
      const nextMatch = yield* Effect.promise(() => ctx.db.get(args.matchId));

      if (!nextMatch) {
        return yield* new MatchNotFound({ matchId: String(args.matchId) });
      }

      return yield* Effect.promise(() => buildSnapshot(ctx, nextMatch, round, sessionId));
    }

    const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
    if (existingNames.has(playerName.toLowerCase())) {
      return yield* new NameAlreadyTaken({ name: playerName });
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

    yield* Effect.promise(() => setPlayerSession(ctx, sessionId, playerId));

    const round = yield* Effect.promise(() => getLatestRound(ctx, args.matchId));
    return yield* Effect.promise(() => buildSnapshot(ctx, match, round, sessionId));
  });
}

export const joinMatch = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerName: v.string(),
    playerColorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await joinMatchForSession(ctx, args),
});

function normalizePlayerColorId(colorId: string | undefined, takenColorIds: string[]) {
  if (!colorId) {
    return firstAvailablePlayerColorId(takenColorIds);
  }

  if (!isPlayerColorId(colorId)) {
    throw new InvalidPlayerColor({ colorId });
  }

  if (takenColorIds.includes(colorId)) {
    throw new PlayerColorAlreadyTaken({ colorId });
  }

  return colorId;
}

export async function startMatchForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  return await Effect.runPromise(startMatchForSessionEffect(ctx, args));
}

export function startMatchForSessionEffect(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    idempotencyKey: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  const sessionId = args.sessionId as SessionId;

  return Effect.gen(function* () {
    yield* enforceRateLimitEffect(ctx, "startMatch", String(args.sessionId));

    return yield* runGameCommandEffect(ctx, {
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
