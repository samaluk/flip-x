import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { MutationCtx } from "../../convex/_generated/server";
import { computeScoreBreakdown } from "../logic/scoring";
import { encodeRoundEvent, type RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";
import type { GameCommand } from "../application/game-command";

export type GameTransition = {
  command: GameCommand["type"];
  roundWrite:
    | {
        kind: "create";
        roundNumber: number;
        startedAt: number;
        round: RoundRuntime;
      }
    | {
        kind: "update";
        roundId: Id<"rounds">;
        round: RoundRuntime;
      };
  playerStates: Record<string, PlayerRoundState>;
  events: RoundEvent[];
  finalized?: {
    round: RoundRuntime;
    playerStates: Record<string, PlayerRoundState>;
    events: RoundEvent[];
  };
  matchUpdateContext: {
    nextMatchStatus?: "in_progress" | "completed";
    nextCurrentRoundNumber?: number;
    nextDealerSeat?: number;
  };
};

export type SaveCommandResultInput = {
  match: Doc<"matches">;
  players: Doc<"players">[];
  playerIdMap: Map<string, Id<"players">>;
  transition: GameTransition;
};

function serializeRoundRuntime(round: RoundRuntime, playerIdMap: Map<string, Id<"players">>) {
  return {
    phase: round.phase,
    dealerSeat: round.dealerSeat,
    activePlayerId: round.activePlayerId ? playerIdMap.get(round.activePlayerId) : undefined,
    drawPile: round.drawPile,
    discardPile: round.discardPile,
    openingSeatIndex: round.openingSeatIndex,
    turnSeatIndex: round.turnSeatIndex,
    endedBy: round.endedBy,
    pendingAction: round.pendingAction
      ? {
          sourcePlayerId: playerIdMap.get(round.pendingAction.sourcePlayerId)!,
          actionKind: round.pendingAction.actionKind,
          eligibleTargetIds: round.pendingAction.eligibleTargetIds.map(
            (playerId) => playerIdMap.get(playerId)!,
          ),
          resume: round.pendingAction.resume,
        }
      : undefined,
    pendingFlip3: round.pendingFlip3
      ? {
          sourcePlayerId: playerIdMap.get(round.pendingFlip3.sourcePlayerId)!,
          targetPlayerId: playerIdMap.get(round.pendingFlip3.targetPlayerId)!,
          cardsRemaining: round.pendingFlip3.cardsRemaining,
          deferredActionCards: round.pendingFlip3.deferredActionCards,
        }
      : undefined,
  };
}

async function createRound(
  ctx: MutationCtx,
  matchId: Id<"matches">,
  roundWrite: Extract<GameTransition["roundWrite"], { kind: "create" }>,
  playerIdMap: Map<string, Id<"players">>,
) {
  return await ctx.db.insert("rounds", {
    matchId,
    roundNumber: roundWrite.roundNumber,
    ...serializeRoundRuntime(roundWrite.round, playerIdMap),
    startedAt: roundWrite.startedAt,
    endedAt: roundWrite.round.phase === "completed" ? Date.now() : undefined,
  });
}

async function persistRoundRuntime(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  round: RoundRuntime,
  playerIdMap: Map<string, Id<"players">>,
) {
  await ctx.db.patch(roundId, {
    ...serializeRoundRuntime(round, playerIdMap),
    endedAt: round.phase === "completed" ? Date.now() : undefined,
  });
}

async function persistPlayerStates(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  playerStates: Record<string, PlayerRoundState>,
  playerIdMap: Map<string, Id<"players">>,
) {
  const stateDocs = await ctx.db
    .query("roundPlayerStates")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();
  const docMap = new Map(stateDocs.map((doc) => [String(doc.playerId), doc]));

  for (const [playerId, playerState] of Object.entries(playerStates)) {
    const existing = docMap.get(playerId);

    if (!existing) {
      const { playerId: _playerId, bustCard, ...rest } = playerState;
      await ctx.db.insert("roundPlayerStates", {
        roundId,
        playerId: playerIdMap.get(playerId)!,
        ...rest,
        ...(bustCard ? { bustCard } : {}),
      });
      continue;
    }

    await ctx.db.patch(existing._id, {
      status: playerState.status,
      numberCards: playerState.numberCards,
      modifierCards: playerState.modifierCards,
      heldActionCards: playerState.heldActionCards,
      receivedActionCards: playerState.receivedActionCards,
      roundScore: playerState.roundScore,
      pointsAtRisk: playerState.pointsAtRisk,
      hasFlip7: playerState.hasFlip7,
      ...(playerState.bustCard ? { bustCard: playerState.bustCard } : {}),
    });
  }
}

async function persistEvents(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  events: RoundEvent[],
  playerIdMap: Map<string, Id<"players">>,
) {
  if (events.length === 0) {
    return;
  }

  const existingEvents = await ctx.db
    .query("roundEvents")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();
  let sequence = existingEvents.length;

  for (const event of events) {
    const persistedEvent = encodeRoundEvent(event);
    sequence += 1;
    await ctx.db.insert("roundEvents", {
      roundId,
      sequence,
      eventType: persistedEvent.eventType,
      actorPlayerId: persistedEvent.actorPlayerId
        ? playerIdMap.get(persistedEvent.actorPlayerId)
        : undefined,
      targetPlayerId: persistedEvent.targetPlayerId
        ? playerIdMap.get(persistedEvent.targetPlayerId)
        : undefined,
      payload: persistedEvent.payload,
      createdAt: Date.now(),
    });
  }
}

async function rewriteScoreBreakdowns(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  playerStates: Record<string, PlayerRoundState>,
  playerIdMap: Map<string, Id<"players">>,
) {
  const existingBreakdowns = await ctx.db
    .query("scoreBreakdowns")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();

  for (const breakdown of existingBreakdowns) {
    await ctx.db.delete(breakdown._id);
  }

  for (const [playerId, playerState] of Object.entries(playerStates)) {
    await ctx.db.insert("scoreBreakdowns", {
      roundId,
      playerId: playerIdMap.get(playerId)!,
      ...computeScoreBreakdown(playerState),
    });
  }
}

async function carryForwardScoresAndMaybeCompleteMatch(
  ctx: MutationCtx,
  input: SaveCommandResultInput,
  finalizedPlayerStates: Record<string, PlayerRoundState>,
) {
  const { match, players } = input;

  for (const player of players) {
    const playerState = finalizedPlayerStates[String(player._id)];
    if (!playerState) {
      continue;
    }

    await ctx.db.patch(player._id, {
      totalScore: player.totalScore + playerState.roundScore,
    });
  }

  const updatedPlayers = await ctx.db
    .query("players")
    .withIndex("by_match", (query) => query.eq("matchId", match._id))
    .collect();
  const winner = updatedPlayers
    .filter((player) => player.totalScore >= match.targetScore)
    .toSorted((left, right) => right.totalScore - left.totalScore)[0];

  if (!winner) {
    return false;
  }

  await ctx.db.patch(match._id, {
    status: "completed",
    winnerPlayerId: winner._id,
    updatedAt: Date.now(),
  });

  for (const player of updatedPlayers) {
    await ctx.db.patch(player._id, { hasWon: player._id === winner._id });
  }

  return true;
}

export async function saveCommandResult(ctx: MutationCtx, input: SaveCommandResultInput) {
  const { match, playerIdMap, transition } = input;
  const roundId =
    transition.roundWrite.kind === "create"
      ? await createRound(ctx, match._id, transition.roundWrite, playerIdMap)
      : transition.roundWrite.roundId;

  const latestRound = transition.finalized?.round ?? transition.roundWrite.round;
  const latestPlayerStates = transition.finalized?.playerStates ?? transition.playerStates;
  const latestEvents = [...transition.events, ...(transition.finalized?.events ?? [])];

  await persistPlayerStates(ctx, roundId, latestPlayerStates, playerIdMap);
  await persistRoundRuntime(ctx, roundId, latestRound, playerIdMap);
  await persistEvents(ctx, roundId, latestEvents, playerIdMap);

  let matchCompleted = false;

  if (transition.finalized) {
    await rewriteScoreBreakdowns(ctx, roundId, transition.finalized.playerStates, playerIdMap);
    matchCompleted = await carryForwardScoresAndMaybeCompleteMatch(
      ctx,
      input,
      transition.finalized.playerStates,
    );
  }

  if (!matchCompleted) {
    const patch: Partial<Doc<"matches">> = {
      updatedAt: Date.now(),
    };

    if (transition.matchUpdateContext.nextMatchStatus) {
      patch.status = transition.matchUpdateContext.nextMatchStatus;
    }
    if (transition.matchUpdateContext.nextCurrentRoundNumber !== undefined) {
      patch.currentRoundNumber = transition.matchUpdateContext.nextCurrentRoundNumber;
    }
    if (transition.matchUpdateContext.nextDealerSeat !== undefined) {
      patch.dealerSeat = transition.matchUpdateContext.nextDealerSeat;
    }

    await ctx.db.patch(match._id, patch);
  }

  return {
    roundId,
    matchCompleted,
  };
}
