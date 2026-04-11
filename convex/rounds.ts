import { v } from "convex/values";

import { mutation } from "./_generated/server";
import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  finalizeRound,
} from "../lib/game/turn-resolution";
import {
  buildOrderedPlayers,
  buildPlayerIdMap,
  buildSnapshot,
  getLatestRound,
  getPlayersByMatch,
  persistEvents,
  persistPlayerStates,
  persistRoundRuntime,
  persistScoreBreakdowns,
  requireViewerPlayerId,
} from "./lib/store";

export const startNextRound = mutation({
  args: {
    matchId: v.id("matches"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);

    if (!match || match.status !== "in_progress") {
      throw new Error("INVALID_MATCH_STATE");
    }

    const players = await getPlayersByMatch(ctx, args.matchId);
    const viewerPlayerId = requireViewerPlayerId(players, args.sessionId);
    await ctx.db.patch(viewerPlayerId, {
      connected: true,
      lastSeenAt: Date.now(),
    });
    const orderedPlayers = buildOrderedPlayers(players);
    const nextDealerSeat = (match.dealerSeat + 1) % players.length;
    const playerStates = createPlayerRoundStates(orderedPlayers);
    const baseRound = createRoundRuntime(
      orderedPlayers,
      match.currentRoundNumber + 1,
      nextDealerSeat,
    );
    const resolved = continueRound(orderedPlayers, baseRound, playerStates);

    const roundId = await ctx.db.insert("rounds", {
      matchId: args.matchId,
      roundNumber: match.currentRoundNumber + 1,
      phase: resolved.round.phase,
      dealerSeat: nextDealerSeat,
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

    const playerIdMap = buildPlayerIdMap(players);
    await persistPlayerStates(ctx, roundId, resolved.playerStates, playerIdMap);
    await persistEvents(ctx, roundId, resolved.events, playerIdMap);

    if (resolved.round.phase === "scoring") {
      const finalized = finalizeRound(resolved.round, resolved.playerStates);
      await persistPlayerStates(ctx, roundId, finalized.playerStates, playerIdMap);
      await persistRoundRuntime(ctx, roundId, finalized.round, playerIdMap);
      await persistEvents(ctx, roundId, finalized.events, playerIdMap);
      await persistScoreBreakdowns(ctx, roundId, finalized.playerStates, playerIdMap);
    }

    await ctx.db.patch(args.matchId, {
      dealerSeat: nextDealerSeat,
      currentRoundNumber: match.currentRoundNumber + 1,
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
