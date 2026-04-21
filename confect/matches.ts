import { v } from "convex/values";
import type { SessionId } from "convex-helpers/server/sessions";
import { getOneFrom } from "convex-helpers/server/relationships";

import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  finalizeRound,
} from "../game/logic/turn-resolution";
import { generateLobbyCode } from "../shared/lib/lobby-code";
import { enforceRateLimit } from "./lib/rate_limiter";
import { mutationWithSession, queryWithSession } from "./lib/session_functions";
import { setPlayerSession } from "./lib/session_store";
import type { Id } from "../convex/_generated/dataModel";
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
import type { MutationCtx } from "../convex/_generated/server";
import {
  InvalidHostName,
  InvalidMatchState,
  InvalidPlayerName,
  InsufficientPlayers,
  LobbyCodeUnavailable,
  LobbyNotFound,
  MatchNotFound,
  NameAlreadyTaken,
  NotHost,
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
    throw new LobbyCodeUnavailable();
  }

  return lobbyCode;
}

export async function createMatchForSession(
  ctx: MutationCtx,
  args: { hostName: string; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  await enforceRateLimit(ctx, "createMatch", String(args.sessionId));

  const hostName = args.hostName.trim();

  if (!hostName || hostName.length > 20) {
    throw new InvalidHostName();
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

  await setPlayerSession(ctx, sessionId, hostPlayerId);
  await ctx.db.patch(matchId, { hostPlayerId });

  const match = await ctx.db.get(matchId);
  if (!match) {
    throw new MatchNotFound({ matchId: String(matchId) });
  }

  return await buildSnapshot(ctx, match, null, sessionId);
}

export async function joinByCodeForSession(
  ctx: MutationCtx,
  args: { lobbyCode: string; sessionId: string },
) {
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
}

export const createMatch = mutationWithSession({
  args: {
    hostName: v.string(),
  },
  handler: async (ctx, args) => await createMatchForSession(ctx, args),
});

export const getCurrentPlayer = queryWithSession({
  args: {},
  handler: async (ctx, args) => {
    const playerSession = await getOneFrom(
      ctx.db,
      "playerSessions",
      "by_session_id",
      args.sessionId,
      "sessionId",
    );

    if (!playerSession) {
      return null;
    }

    const player = await ctx.db.get(playerSession.playerId);
    if (!player) {
      return null;
    }

    return {
      displayName: player.displayName,
    };
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

export const joinByCode = mutationWithSession({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => await joinByCodeForSession(ctx, args),
});

export async function joinMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

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
  const existingViewerPlayerId = await getViewerPlayerId(ctx, args.matchId, sessionId);

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

    return await buildSnapshot(ctx, nextMatch, round, sessionId);
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

  await setPlayerSession(ctx, sessionId, playerId);

  const round = await getLatestRound(ctx, args.matchId);
  return await buildSnapshot(ctx, match, round, sessionId);
}

export const joinMatch = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerName: v.string(),
  },
  handler: async (ctx, args) => await joinMatchForSession(ctx, args),
});

export async function startMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  await enforceRateLimit(ctx, "startMatch", String(args.sessionId));

  const match = await ctx.db.get(args.matchId);

  if (!match || match.status !== "setup") {
    throw new InvalidMatchState();
  }

  const viewerPlayerId = await requireViewerPlayerId(ctx, args.matchId, sessionId);
  if (match.hostPlayerId !== viewerPlayerId) {
    throw new NotHost();
  }

  const players = await getPlayersByMatch(ctx, args.matchId);
  if (players.length < 2) {
    throw new InsufficientPlayers({ minPlayers: 2 });
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
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  return await buildSnapshot(ctx, nextMatch, nextRound, sessionId);
}
