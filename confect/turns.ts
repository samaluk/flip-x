import type { SessionId } from "convex-helpers/server/sessions";

import {
  finalizeRound,
  resolvePendingAction,
  takeTurnAction,
} from "../game/logic/turn-resolution";
import type { ActionCard, Card } from "../game/logic/card-types";
import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import {
  buildOrderedPlayers,
  buildPlayerIdMap,
  buildSnapshot,
  getLatestRound,
  getPlayersByMatch,
  getRoundPlayerStateDocs,
  persistEvents,
  persistPlayerStates,
  persistRoundRuntime,
  persistScoreBreakdowns,
  requireViewerPlayerId,
} from "./lib/store";
import { InvalidAction, InvalidTurn, MatchNotFound } from "../shared/lib/errors/domain";

function normalizeRound(round: NonNullable<Awaited<ReturnType<typeof getLatestRound>>>) {
  return {
    phase: round.phase,
    roundNumber: round.roundNumber,
    dealerSeat: round.dealerSeat,
    activePlayerId: round.activePlayerId ? String(round.activePlayerId) : null,
    drawPile: round.drawPile as Card[],
    discardPile: round.discardPile as Card[],
    openingSeatIndex: round.openingSeatIndex,
    turnSeatIndex: round.turnSeatIndex,
    endedBy: round.endedBy,
    pendingAction: round.pendingAction
      ? {
          sourcePlayerId: String(round.pendingAction.sourcePlayerId),
          actionKind: round.pendingAction.actionKind,
          eligibleTargetIds: round.pendingAction.eligibleTargetIds.map((id) => String(id)),
          resume: round.pendingAction.resume,
        }
      : null,
    pendingFlip3: round.pendingFlip3
      ? {
          sourcePlayerId: String(round.pendingFlip3.sourcePlayerId),
          targetPlayerId: String(round.pendingFlip3.targetPlayerId),
          cardsRemaining: round.pendingFlip3.cardsRemaining,
          deferredActionCards: round.pendingFlip3.deferredActionCards as ActionCard[],
        }
      : null,
  };
}

function normalizePlayerStates(
  roundPlayerStates: Awaited<ReturnType<typeof getRoundPlayerStateDocs>>,
) {
  return Object.fromEntries(
    roundPlayerStates.map((playerState) => [
      String(playerState.playerId),
      {
        playerId: String(playerState.playerId),
        status: playerState.status,
        numberCards: playerState.numberCards as never,
        modifierCards: playerState.modifierCards as never,
        heldActionCards: playerState.heldActionCards as never,
        receivedActionCards: playerState.receivedActionCards as never,
        roundScore: playerState.roundScore,
        pointsAtRisk: playerState.pointsAtRisk,
        hasFlip7: playerState.hasFlip7,
      },
    ]),
  );
}

export async function takeTurnForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; action: "hit" | "stay"; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  const match = await ctx.db.get(args.matchId);
  const round = await getLatestRound(ctx, args.matchId);

  if (!match || !round) {
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  const players = await getPlayersByMatch(ctx, args.matchId);
  const viewerPlayerId = await requireViewerPlayerId(ctx, args.matchId, sessionId);

  if (!round.activePlayerId || round.activePlayerId !== viewerPlayerId) {
    throw new InvalidTurn();
  }

  const orderedPlayers = buildOrderedPlayers(players);
  const roundPlayerStates = await getRoundPlayerStateDocs(ctx, round._id);
  const playerStates = normalizePlayerStates(roundPlayerStates);

  const resolved = takeTurnAction(
    orderedPlayers,
    normalizeRound(round),
    playerStates,
    String(viewerPlayerId),
    args.action,
  );

  const playerIdMap = buildPlayerIdMap(players);
  await persistPlayerStates(ctx, round._id, resolved.playerStates, playerIdMap);
  await persistRoundRuntime(ctx, round._id, resolved.round, playerIdMap);
  await persistEvents(ctx, round._id, resolved.events, playerIdMap);

  if (resolved.round.phase === "scoring") {
    const finalized = finalizeRound(resolved.round, resolved.playerStates);
    await persistPlayerStates(ctx, round._id, finalized.playerStates, playerIdMap);
    await persistRoundRuntime(ctx, round._id, finalized.round, playerIdMap);
    await persistEvents(ctx, round._id, finalized.events, playerIdMap);
    await persistScoreBreakdowns(ctx, round._id, finalized.playerStates, playerIdMap);

    for (const player of players) {
      const nextState = finalized.playerStates[String(player._id)];
      await ctx.db.patch(player._id, {
        totalScore: player.totalScore + nextState.roundScore,
      });
    }

    const updatedPlayers = await getPlayersByMatch(ctx, args.matchId);
    const winners = updatedPlayers.filter((player) => player.totalScore >= match.targetScore);

    if (winners.length > 0) {
      const winner = updatedPlayers.toSorted((left, right) => right.totalScore - left.totalScore)[0];

      await ctx.db.patch(args.matchId, {
        status: "completed",
        winnerPlayerId: winner._id,
        updatedAt: Date.now(),
      });

      for (const player of updatedPlayers) {
        await ctx.db.patch(player._id, { hasWon: player._id === winner._id });
      }
    } else {
      await ctx.db.patch(args.matchId, {
        updatedAt: Date.now(),
      });
    }
  }

  const nextMatch = await ctx.db.get(args.matchId);
  const nextRound = await getLatestRound(ctx, args.matchId);

  if (!nextMatch || !nextRound) {
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  return await buildSnapshot(ctx, nextMatch, nextRound, sessionId);
}

export async function resolveActionForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; targetPlayerId: Id<"players">; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  const match = await ctx.db.get(args.matchId);
  const round = await getLatestRound(ctx, args.matchId);

  if (!match || !round) {
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  const players = await getPlayersByMatch(ctx, args.matchId);
  const viewerPlayerId = await requireViewerPlayerId(ctx, args.matchId, sessionId);

  if (!round.pendingAction || round.pendingAction.sourcePlayerId !== viewerPlayerId) {
    throw new InvalidAction();
  }

  const orderedPlayers = buildOrderedPlayers(players);
  const roundPlayerStates = await getRoundPlayerStateDocs(ctx, round._id);
  const playerStates = normalizePlayerStates(roundPlayerStates);

  const resolved = resolvePendingAction(
    orderedPlayers,
    normalizeRound(round),
    playerStates,
    String(args.targetPlayerId),
  );

  const playerIdMap = buildPlayerIdMap(players);
  await persistPlayerStates(ctx, round._id, resolved.playerStates, playerIdMap);
  await persistRoundRuntime(ctx, round._id, resolved.round, playerIdMap);
  await persistEvents(ctx, round._id, resolved.events, playerIdMap);

  const nextMatch = await ctx.db.get(args.matchId);
  const nextRound = await getLatestRound(ctx, args.matchId);

  if (!nextMatch || !nextRound) {
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  return await buildSnapshot(ctx, nextMatch, nextRound, sessionId);
}
