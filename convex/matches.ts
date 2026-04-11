import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  createPlayerRoundStates,
  createRoundRuntime,
  continueRound,
  finalizeRound,
} from "../lib/game/turn-resolution";
import {
  buildOrderedPlayers,
  buildPlayerIdMap,
  buildSnapshot,
  getLatestRound,
  getPlayersByMatch,
  requireViewerPlayerId,
  persistEvents,
  persistPlayerStates,
  persistRoundRuntime,
  persistScoreBreakdowns,
} from "./lib/store";

import { generateLobbyCode } from "./lib/lobby_code";

export const createMatch = mutation({
  args: {
    hostName: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const hostName = args.hostName.trim();
    const sessionId = args.sessionId;

    if (!hostName || hostName.length > 20) {
      throw new Error("INVALID_HOST_NAME");
    }

    let lobbyCode = generateLobbyCode();
    let existing = await ctx.db
      .query("matches")
      .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", lobbyCode))
      .first();
    let attempts = 0;
    while (existing && attempts < 10) {
      lobbyCode = generateLobbyCode();
      existing = await ctx.db
        .query("matches")
        .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", lobbyCode))
        .first();
      attempts++;
    }
    if (existing) {
      throw new Error("LOBBY_CODE_UNAVAILABLE");
    }

    const timestamp = Date.now();

    const matchId = await ctx.db.insert("matches", {
      status: "setup",
      lobbyCode,
      hostSessionId: sessionId,
      targetScore: 200,
      currentRoundNumber: 0,
      dealerSeat: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.insert("players", {
      matchId,
      displayName: hostName,
      seatIndex: 0,
      totalScore: 0,
      hasWon: false,
      claimedBySessionId: sessionId,
      claimedAt: timestamp,
      connected: true,
      lastSeenAt: timestamp,
    });

    const match = await ctx.db.get(matchId);

    if (!match) {
      throw new Error("MATCH_NOT_FOUND");
    }

    return await buildSnapshot(ctx, match, null, sessionId);
  },
});

export const getMatchSnapshot = query({
  args: {
    matchId: v.id("matches"),
    sessionId: v.optional(v.string()),
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

export const getMatchByCode = query({
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

export const joinByCode = mutation({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      throw new Error("LOBBY_NOT_FOUND");
    }

    const match = await ctx.db
      .query("matches")
      .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", normalized))
      .first();

    if (!match || match.status !== "setup") {
      throw new Error("LOBBY_NOT_FOUND");
    }

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
    };
  },
});

export const joinMatch = mutation({
  args: {
    matchId: v.id("matches"),
    playerName: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);

    if (!match || match.status !== "setup") {
      throw new Error("MATCH_NOT_FOUND");
    }

    const sessionId = args.sessionId;

    const playerName = args.playerName.trim();
    if (!playerName || playerName.length > 20) {
      throw new Error("INVALID_PLAYER_NAME");
    }

    const players = await getPlayersByMatch(ctx, args.matchId);

    const existingNames = new Set(players.map(p => p.displayName.toLowerCase()));
    if (existingNames.has(playerName.toLowerCase())) {
      throw new Error("NAME_ALREADY_TAKEN");
    }

    const timestamp = Date.now();

    for (const currentPlayer of players) {
      if (currentPlayer.claimedBySessionId === sessionId) {
        await ctx.db.patch(currentPlayer._id, {
          claimedBySessionId: undefined,
          claimedAt: undefined,
          connected: false,
        });
      }
    }

    const afterUnclaim = await getPlayersByMatch(ctx, args.matchId);
    const availableSeat = afterUnclaim.find(p => !p.claimedBySessionId);

    if (availableSeat) {
      await ctx.db.patch(availableSeat._id, {
        claimedBySessionId: sessionId,
        claimedAt: timestamp,
        connected: true,
        lastSeenAt: timestamp,
        displayName: playerName,
      });
    } else {
      const nextSeat =
        afterUnclaim.length === 0
          ? 0
          : Math.max(...afterUnclaim.map((p) => p.seatIndex)) + 1;
      await ctx.db.insert("players", {
        matchId: args.matchId,
        displayName: playerName,
        seatIndex: nextSeat,
        totalScore: 0,
        hasWon: false,
        claimedBySessionId: sessionId,
        claimedAt: timestamp,
        connected: true,
        lastSeenAt: timestamp,
      });
    }

    const round = await getLatestRound(ctx, args.matchId);
    return await buildSnapshot(ctx, match, round, sessionId);
  },
});

export const claimSeat = mutation({
  args: {
    matchId: v.id("matches"),
    playerId: v.id("players"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    const player = await ctx.db.get(args.playerId);

    if (!match || !player || player.matchId !== args.matchId) {
      throw new Error("MATCH_NOT_FOUND");
    }

    const players = await getPlayersByMatch(ctx, args.matchId);
    const timestamp = Date.now();

    for (const currentPlayer of players) {
      if (currentPlayer._id === args.playerId) {
        if (
          currentPlayer.claimedBySessionId &&
          currentPlayer.claimedBySessionId !== args.sessionId
        ) {
          throw new Error("SEAT_ALREADY_CLAIMED");
        }

        continue;
      }

      if (currentPlayer.claimedBySessionId === args.sessionId) {
        await ctx.db.patch(currentPlayer._id, {
          claimedBySessionId: undefined,
          claimedAt: undefined,
          connected: false,
        });
      }
    }

    await ctx.db.patch(args.playerId, {
      claimedBySessionId: args.sessionId,
      claimedAt: timestamp,
      connected: true,
      lastSeenAt: timestamp,
    });

    const round = await getLatestRound(ctx, args.matchId);
    return await buildSnapshot(ctx, match, round, args.sessionId);
  },
});

export const startMatch = mutation({
  args: {
    matchId: v.id("matches"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);

    if (!match || match.status !== "setup") {
      throw new Error("INVALID_MATCH_STATE");
    }

    if (match.hostSessionId !== args.sessionId) {
      throw new Error("NOT_HOST");
    }

    const players = await getPlayersByMatch(ctx, args.matchId);
    const claimedPlayers = players.filter((p) => p.claimedBySessionId);
    if (claimedPlayers.length < 3) {
      throw new Error("INSUFFICIENT_PLAYERS");
    }

    const viewerPlayerId = requireViewerPlayerId(players, args.sessionId);
    await ctx.db.patch(viewerPlayerId, {
      connected: true,
      lastSeenAt: Date.now(),
    });
    // Only claimed seats participate in the round (empty placeholders are ignored).
    const orderedPlayers = buildOrderedPlayers(claimedPlayers);
    const playerStates = createPlayerRoundStates(orderedPlayers);
    const baseRound = createRoundRuntime(orderedPlayers, 1, match.dealerSeat);
    const resolved = continueRound(orderedPlayers, baseRound, playerStates);

    const roundId = await ctx.db.insert("rounds", {
      matchId: args.matchId,
      roundNumber: 1,
      phase: resolved.round.phase,
      dealerSeat: resolved.round.dealerSeat,
      activePlayerId: resolved.round.activePlayerId
        ? (players.find((player) => String(player._id) === resolved.round.activePlayerId)?._id ??
          undefined)
        : undefined,
      drawPile: resolved.round.drawPile,
      discardPile: resolved.round.discardPile,
      openingSeatIndex: resolved.round.openingSeatIndex,
      turnSeatIndex: resolved.round.turnSeatIndex,
      endedBy: resolved.round.endedBy,
      pendingAction: resolved.round.pendingAction
        ? {
            sourcePlayerId: players.find(
              (player) => String(player._id) === resolved.round.pendingAction?.sourcePlayerId,
            )!._id,
            actionKind: resolved.round.pendingAction.actionKind,
            eligibleTargetIds: resolved.round.pendingAction.eligibleTargetIds.map(
              (playerId) => players.find((player) => String(player._id) === playerId)!._id,
            ),
            resume: resolved.round.pendingAction.resume,
          }
        : undefined,
      startedAt: Date.now(),
    });

    const playerIdMap = buildPlayerIdMap(claimedPlayers);
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
      status: finalRound.phase === "completed" ? "in_progress" : "in_progress",
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
