import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { MutationCtx } from "../../convex/_generated/server";
import type { RoundCompletionOutcome } from "../application/round-completion";
import type { RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";
import type { GameCommand } from "../application/game-command";
import {
  serializePlayerRoundState,
  serializePlayerRoundStatePatch,
  serializeRoundEvent,
  serializeRoundRuntime,
} from "./serializers";

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
  finalized?: RoundCompletionOutcome;
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
  nowMillis?: number;
};

async function createRound(
  ctx: MutationCtx,
  matchId: Id<"matches">,
  roundWrite: Extract<GameTransition["roundWrite"], { kind: "create" }>,
  playerIdMap: Map<string, Id<"players">>,
  nowMillis: number,
) {
  return await ctx.db.insert("rounds", {
    matchId,
    roundNumber: roundWrite.roundNumber,
    ...serializeRoundRuntime(roundWrite.round, playerIdMap),
    startedAt: roundWrite.startedAt,
    endedAt: roundWrite.round.phase === "completed" ? nowMillis : undefined,
  });
}

async function persistRoundRuntime(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  round: RoundRuntime,
  playerIdMap: Map<string, Id<"players">>,
  nowMillis: number,
) {
  await ctx.db.patch(roundId, {
    ...serializeRoundRuntime(round, playerIdMap),
    endedAt: round.phase === "completed" ? nowMillis : undefined,
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
      await ctx.db.insert(
        "roundPlayerStates",
        serializePlayerRoundState(roundId, playerState, playerIdMap),
      );
      continue;
    }

    await ctx.db.patch(existing._id, serializePlayerRoundStatePatch(playerState));
  }
}

async function persistEvents(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  events: RoundEvent[],
  playerIdMap: Map<string, Id<"players">>,
  nowMillis: number,
) {
  if (events.length === 0) {
    return;
  }

  const existingEvents = await ctx.db
    .query("roundEvents")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();
  let sequence = existingEvents.length;

  // Event sequence must be assigned sequentially; parallel inserts race on `sequence`.
  for (const event of events) {
    const persistedEvent = serializeRoundEvent(event, playerIdMap);
    sequence += 1;
    await ctx.db.insert("roundEvents", {
      roundId,
      sequence,
      eventType: persistedEvent.eventType,
      actorPlayerId: persistedEvent.actorPlayerId,
      targetPlayerId: persistedEvent.targetPlayerId,
      payload: persistedEvent.payload,
      createdAt: nowMillis,
    });
  }
}

async function rewriteScoreBreakdowns(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  scoreBreakdowns: RoundCompletionOutcome["scoreBreakdowns"],
  playerIdMap: Map<string, Id<"players">>,
) {
  const existingBreakdowns = await ctx.db
    .query("scoreBreakdowns")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();

  for (const breakdown of existingBreakdowns) {
    await ctx.db.delete(breakdown._id);
  }

  for (const [playerId, scoreBreakdown] of Object.entries(scoreBreakdowns)) {
    await ctx.db.insert("scoreBreakdowns", {
      roundId,
      playerId: playerIdMap.get(playerId)!,
      ...scoreBreakdown,
    });
  }
}

async function persistRoundCompletionOutcome(ctx: MutationCtx, input: SaveCommandResultInput) {
  const { playerIdMap, transition } = input;
  const finalized = transition.finalized;

  if (!finalized) {
    return false;
  }

  for (const [playerId, patch] of Object.entries(finalized.playerScorePatches)) {
    await ctx.db.patch(playerIdMap.get(playerId)!, {
      totalScore: patch.totalScore,
      hasWon: patch.hasWon,
    });
  }

  return finalized.matchCompleted;
}

export async function saveCommandResult(ctx: MutationCtx, input: SaveCommandResultInput) {
  const { match, playerIdMap, transition } = input;
  const nowMillis = input.nowMillis ?? Date.now();
  const roundId =
    transition.roundWrite.kind === "create"
      ? await createRound(ctx, match._id, transition.roundWrite, playerIdMap, nowMillis)
      : transition.roundWrite.roundId;

  const latestRound = transition.finalized?.round ?? transition.roundWrite.round;
  const latestPlayerStates = transition.finalized?.playerStates ?? transition.playerStates;
  const latestEvents = [...transition.events, ...(transition.finalized?.events ?? [])];

  await persistPlayerStates(ctx, roundId, latestPlayerStates, playerIdMap);
  await persistRoundRuntime(ctx, roundId, latestRound, playerIdMap, nowMillis);
  await persistEvents(ctx, roundId, latestEvents, playerIdMap, nowMillis);

  let matchCompleted = false;

  if (transition.finalized) {
    await rewriteScoreBreakdowns(ctx, roundId, transition.finalized.scoreBreakdowns, playerIdMap);
    matchCompleted = await persistRoundCompletionOutcome(ctx, input);
  }

  const patch: Partial<Doc<"matches">> = {
    version: match.version + 1,
    updatedAt: nowMillis,
  };

  const matchPatch = transition.finalized?.matchPatch;
  const nextMatchStatus = matchPatch?.status ?? transition.matchUpdateContext.nextMatchStatus;
  const nextCurrentRoundNumber =
    matchPatch?.currentRoundNumber ?? transition.matchUpdateContext.nextCurrentRoundNumber;
  const nextDealerSeat = matchPatch?.dealerSeat ?? transition.matchUpdateContext.nextDealerSeat;

  if (nextMatchStatus) {
    patch.status = nextMatchStatus;
  }
  if (nextCurrentRoundNumber !== undefined) {
    patch.currentRoundNumber = nextCurrentRoundNumber;
  }
  if (nextDealerSeat !== undefined) {
    patch.dealerSeat = nextDealerSeat;
  }
  if (matchPatch?.winnerPlayerId) {
    patch.winnerPlayerId = playerIdMap.get(matchPatch.winnerPlayerId)!;
  }

  await ctx.db.patch(match._id, patch);

  return {
    roundId,
    matchCompleted,
  };
}
