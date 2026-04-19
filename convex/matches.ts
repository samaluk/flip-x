import { v } from "convex/values";

import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  finalizeRound,
} from "../game/logic/turn-resolution";
import { generateLobbyCode } from "./lib/lobby_code";
import { enforceRateLimit } from "./lib/rate_limiter";
import { mutationWithSession, queryWithSession } from "./lib/session_functions";
import { setPlayerSession } from "./lib/session_store";
import {
  buildOrderedPlayers,
  buildPlayerIdMap,
  buildSnapshot,
  getLatestRound,
  getPlayersByMatch,
  getViewerPlayerId,
  persistEvents,
  persistPlayerStates,
  persistRoundRuntime,
  persistScoreBreakdowns,
  requireViewerPlayerId,
  serializeRoundRuntime,
} from "./lib/store";
import type { MutationCtx } from "./_generated/server";
import { query as convexQuery } from "./_generated/server";
import {
  InvalidPlayerName,
  LobbyNotFound,
  MatchNotFound,
  NameAlreadyTaken,
} from "../shared/lib/errors/domain";

async function generateUniqueLobbyCode(ctx: MutationCtx) {
  let lobbyCode = generateLobbyCode();
  let existing = await ctx.db
    .query("matches")
    .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
    .first();
  let attempts = 0;

  while (existing && attempts < 10) {
    lobbyCode = generateLobbyCode();
    existing = await ctx.db
      .query("matches")
      .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
      .first();
    attempts += 1;
  }

  if (existing) {
    throw new Error("LOBBY_CODE_UNAVAILABLE");
  }

  return lobbyCode;
}

export const createMatch = mutationWithSession({
  args: {
    hostName: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, "createMatch", String(args.sessionId));

    const hostName = args.hostName.trim();

    if (!hostName || hostName.length > 20) {
      throw new Error("INVALID_HOST_NAME");
    }

    const timestamp = Date.now();
    const lobbyCode = await generateUniqueLobbyCode(ctx);
    const matchId = await ctx.db.insert("matches", {
      status: "setup",
      lobbyCode,
      targetScore: 200,
      currentRoundNumber: 0,
      dealerSeat: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const hostPlayerId = await ctx.db.insert("players", {
      matchId,
      displayName: hostName,
      seatIndex: 0,
      totalScore: 0,
      hasWon: false,
    });

    await setPlayerSession(ctx, args.sessionId, hostPlayerId);
    await ctx.db.patch(matchId, { hostPlayerId });

    const match = await ctx.db.get(matchId);
    if (!match) {
      throw new Error("MATCH_NOT_FOUND");
    }

    return await buildSnapshot(ctx, match, null, args.sessionId);
  },
});

export const getMatchSnapshot = queryWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);

    if (!match) {
      return null;
    }

    const round = await getLatestRound(ctx, args.matchId);
    return await buildSnapshot(ctx, match, round, args.sessionId);
  },
});

export const getMatchByCode = convexQuery({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      return null;
    }

    const match = await ctx.db
      .query("matches")
      .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", normalized))
      .first();

    if (!match || match.status !== "setup") {
      return null;
    }

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
      status: match.status,
    };
  },
});

export const joinByCode = mutationWithSession({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, "joinByCode", String(args.sessionId));

    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      throw new LobbyNotFound();
    }

    const match = await ctx.db
      .query("matches")
      .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", normalized))
      .first();

    if (!match || match.status !== "setup") {
      throw new LobbyNotFound();
    }

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
    };
  },
});

export const joinMatch = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, "joinMatch", String(args.sessionId));

    const match = await ctx.db.get(args.matchId);

    if (!match || match.status !== "setup") {
      throw new MatchNotFound({ matchId: String(args.matchId) });
    }

    const playerName = args.playerName.trim();
    if (!playerName || playerName.length > 20) {
      throw new InvalidPlayerName();
    }

    const players = await getPlayersByMatch(ctx, args.matchId);
    const existingViewerPlayerId = await getViewerPlayerId(ctx, args.matchId, args.sessionId);

    if (existingViewerPlayerId) {
      const existingViewerPlayer = players.find((player) => player._id === existingViewerPlayerId);
      if (!existingViewerPlayer) {
        throw new MatchNotFound({ matchId: String(args.matchId) });
      }

      if (
        existingViewerPlayer.displayName.toLowerCase() !== playerName.toLowerCase() &&
        players.some((player) => player.displayName.toLowerCase() === playerName.toLowerCase())
      ) {
        throw new NameAlreadyTaken({ name: playerName });
      }

      await ctx.db.patch(existingViewerPlayerId, { displayName: playerName });
      const round = await getLatestRound(ctx, args.matchId);
      const nextMatch = await ctx.db.get(args.matchId);

      if (!nextMatch) {
        throw new MatchNotFound({ matchId: String(args.matchId) });
      }

      return await buildSnapshot(ctx, nextMatch, round, args.sessionId);
    }

    const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
    if (existingNames.has(playerName.toLowerCase())) {
      throw new NameAlreadyTaken({ name: playerName });
    }

    const nextSeat =
      players.length === 0 ? 0 : Math.max(...players.map((player) => player.seatIndex)) + 1;
    const playerId = await ctx.db.insert("players", {
      matchId: args.matchId,
      displayName: playerName,
      seatIndex: nextSeat,
      totalScore: 0,
      hasWon: false,
    });

    await setPlayerSession(ctx, args.sessionId, playerId);

    const round = await getLatestRound(ctx, args.matchId);
    return await buildSnapshot(ctx, match, round, args.sessionId);
  },
});

export const startMatch = mutationWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, "startMatch", String(args.sessionId));

    const match = await ctx.db.get(args.matchId);

    if (!match || match.status !== "setup") {
      throw new Error("INVALID_MATCH_STATE");
    }

    const viewerPlayerId = await requireViewerPlayerId(ctx, args.matchId, args.sessionId);
    if (match.hostPlayerId !== viewerPlayerId) {
      throw new Error("NOT_HOST");
    }

    const players = await getPlayersByMatch(ctx, args.matchId);
    if (players.length < 2) {
      throw new Error("INSUFFICIENT_PLAYERS");
    }

    const orderedPlayers = buildOrderedPlayers(players);
    const playerIdMap = buildPlayerIdMap(players);
    const playerStates = createPlayerRoundStates(orderedPlayers);
    const baseRound = createRoundRuntime(orderedPlayers, 1, match.dealerSeat);
    const resolved = continueRound(orderedPlayers, baseRound, playerStates);

    const roundId = await ctx.db.insert("rounds", {
      matchId: args.matchId,
      roundNumber: 1,
      ...serializeRoundRuntime(resolved.round, playerIdMap),
      startedAt: Date.now(),
    });

    await persistPlayerStates(ctx, roundId, resolved.playerStates, playerIdMap);
    await persistEvents(ctx, roundId, resolved.events, playerIdMap);

    let finalRound = resolved.round;
    let finalPlayerStates = resolved.playerStates;

    if (resolved.round.phase === "scoring") {
      const finalized = finalizeRound(resolved.round, resolved.playerStates);
      finalRound = finalized.round;
      finalPlayerStates = finalized.playerStates;

      await persistPlayerStates(ctx, roundId, finalPlayerStates, playerIdMap);
      await persistRoundRuntime(ctx, roundId, finalRound, playerIdMap);
      await persistEvents(ctx, roundId, finalized.events, playerIdMap);
      await persistScoreBreakdowns(ctx, roundId, finalPlayerStates, playerIdMap);
    }

    await ctx.db.patch(args.matchId, {
      status: "in_progress",
      currentRoundNumber: 1,
      updatedAt: Date.now(),
    });

    const nextMatch = await ctx.db.get(args.matchId);
    const nextRound = await getLatestRound(ctx, args.matchId);

    if (!nextMatch || !nextRound) {
      throw new Error("MATCH_NOT_FOUND");
    }

    return await buildSnapshot(ctx, nextMatch, nextRound, args.sessionId);
  },
});
