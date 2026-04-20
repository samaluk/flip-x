import type { SessionId } from "convex-helpers/server/sessions";

import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  finalizeRound,
} from "../game/logic/turn-resolution";
import type { Id } from "../convex/_generated/dataModel";
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
  serializeRoundRuntime,
} from "../convex/lib/store";
import type { MutationCtx } from "../convex/_generated/server";
import { InvalidMatchState, MatchNotFound } from "../shared/lib/errors/domain";

export async function startNextRoundForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  const match = await ctx.db.get(args.matchId);

  if (!match || match.status !== "in_progress") {
    throw new InvalidMatchState();
  }

  const players = await getPlayersByMatch(ctx, args.matchId);
  await requireViewerPlayerId(ctx, args.matchId, sessionId);
  const orderedPlayers = buildOrderedPlayers(players);
  const playerIdMap = buildPlayerIdMap(players);
  const nextDealerSeat = (match.dealerSeat + 1) % players.length;
  const playerStates = createPlayerRoundStates(orderedPlayers);
  const baseRound = createRoundRuntime(orderedPlayers, match.currentRoundNumber + 1, nextDealerSeat);
  const resolved = continueRound(orderedPlayers, baseRound, playerStates);

  const roundId = await ctx.db.insert("rounds", {
    matchId: args.matchId,
    roundNumber: match.currentRoundNumber + 1,
    ...serializeRoundRuntime(resolved.round, playerIdMap),
    startedAt: Date.now(),
  });

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
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  return await buildSnapshot(ctx, nextMatch, nextRound, sessionId);
}
