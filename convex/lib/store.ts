import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { buildMatchSnapshot, toOrderedPlayers } from "../../lib/game/view-models";
import { scoreRound } from "../../lib/game/scoring";
import type { Card } from "../../lib/game/card-types";
import type { PlayerRoundState, RoundEvent, RoundRuntime } from "../../lib/game/turn-resolution";

function normalizePlayerRoundState(doc: Doc<"roundPlayerStates">): PlayerRoundState {
  return {
    playerId: String(doc.playerId),
    status: doc.status,
    numberCards: doc.numberCards as PlayerRoundState["numberCards"],
    modifierCards: doc.modifierCards as PlayerRoundState["modifierCards"],
    heldActionCards: doc.heldActionCards as PlayerRoundState["heldActionCards"],
    roundScore: doc.roundScore,
    pointsAtRisk: doc.pointsAtRisk,
    hasFlip7: doc.hasFlip7,
  };
}

function normalizeRoundRuntime(doc: Doc<"rounds">): RoundRuntime {
  return {
    phase: doc.phase,
    roundNumber: doc.roundNumber,
    dealerSeat: doc.dealerSeat,
    activePlayerId: doc.activePlayerId ? String(doc.activePlayerId) : null,
    drawPile: doc.drawPile as Card[],
    discardPile: doc.discardPile as Card[],
    openingSeatIndex: doc.openingSeatIndex,
    turnSeatIndex: doc.turnSeatIndex,
    endedBy: doc.endedBy,
    pendingAction: doc.pendingAction
      ? {
          sourcePlayerId: String(doc.pendingAction.sourcePlayerId),
          actionKind: doc.pendingAction.actionKind,
          eligibleTargetIds: doc.pendingAction.eligibleTargetIds.map((id) => String(id)),
          resume: doc.pendingAction.resume,
        }
      : null,
  };
}

export async function getPlayersByMatch(ctx: QueryCtx | MutationCtx, matchId: Id<"matches">) {
  return await ctx.db
    .query("players")
    .withIndex("by_match", (query) => query.eq("matchId", matchId))
    .collect();
}

export function getViewerPlayerId(
  players: Array<{ _id: Id<"players">; claimedBySessionId?: string }>,
  sessionId?: string,
) {
  if (!sessionId) {
    return null;
  }

  return players.find((player) => player.claimedBySessionId === sessionId)?._id ?? null;
}

export function requireViewerPlayerId(
  players: Array<{ _id: Id<"players">; claimedBySessionId?: string }>,
  sessionId: string,
) {
  const playerId = getViewerPlayerId(players, sessionId);

  if (!playerId) {
    throw new Error("SEAT_NOT_CLAIMED");
  }

  return playerId;
}

export async function getLatestRound(ctx: QueryCtx | MutationCtx, matchId: Id<"matches">) {
  const rounds = await ctx.db
    .query("rounds")
    .withIndex("by_match", (query) => query.eq("matchId", matchId))
    .collect();

  return rounds.toSorted((left, right) => right.roundNumber - left.roundNumber)[0] ?? null;
}

export async function getRoundPlayerStateDocs(ctx: QueryCtx | MutationCtx, roundId: Id<"rounds">) {
  return await ctx.db
    .query("roundPlayerStates")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();
}

export async function getLatestRoundEvent(ctx: QueryCtx | MutationCtx, roundId: Id<"rounds">) {
  const events = await ctx.db
    .query("roundEvents")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();

  return events.toSorted((left, right) => right.sequence - left.sequence)[0] ?? null;
}

export async function buildSnapshot(
  ctx: QueryCtx | MutationCtx,
  match: Doc<"matches">,
  round: Doc<"rounds"> | null,
  sessionId?: string,
) {
  const players = await getPlayersByMatch(ctx, match._id);
  const viewerPlayerId = getViewerPlayerId(players, sessionId);

  let playerStates: Record<string, PlayerRoundState> = {};
  let latestEvent: RoundEvent | null = null;

  if (round) {
    const roundPlayerStates = await getRoundPlayerStateDocs(ctx, round._id);

    playerStates = Object.fromEntries(
      roundPlayerStates.map((playerState) => {
        const normalized = normalizePlayerRoundState(playerState);
        return [normalized.playerId, normalized];
      }),
    );

    const latestRoundEvent = await getLatestRoundEvent(ctx, round._id);
    latestEvent = latestRoundEvent
      ? {
          eventType: latestRoundEvent.eventType,
          actorPlayerId: latestRoundEvent.actorPlayerId
            ? String(latestRoundEvent.actorPlayerId)
            : null,
          targetPlayerId: latestRoundEvent.targetPlayerId
            ? String(latestRoundEvent.targetPlayerId)
            : null,
          summary: latestRoundEvent.summary,
          payload:
            typeof latestRoundEvent.payload === "object" && latestRoundEvent.payload
              ? (latestRoundEvent.payload as Record<string, unknown>)
              : undefined,
        }
      : null;
  }

  return buildMatchSnapshot({
    matchId: String(match._id),
    status: match.status,
    targetScore: match.targetScore,
    currentRoundNumber: match.currentRoundNumber,
    dealerSeat: match.dealerSeat,
    viewerPlayerId: viewerPlayerId ? String(viewerPlayerId) : null,
    round: round ? normalizeRoundRuntime(round) : null,
    players: players.map((player) => ({
      playerId: String(player._id),
      displayName: player.displayName,
      seatIndex: player.seatIndex,
      totalScore: player.totalScore,
      isClaimed: Boolean(player.claimedBySessionId),
    })),
    playerStates,
    latestEvent,
  });
}

export async function persistRoundRuntime(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  round: RoundRuntime,
  playerIdMap: Map<string, Id<"players">>,
) {
  await ctx.db.patch(roundId, {
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
    endedAt: round.phase === "completed" ? Date.now() : undefined,
  });
}

export async function persistPlayerStates(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  playerStates: Record<string, PlayerRoundState>,
  playerIdMap: Map<string, Id<"players">>,
) {
  const stateDocs = await getRoundPlayerStateDocs(ctx, roundId);
  const docMap = new Map(stateDocs.map((doc) => [String(doc.playerId), doc]));

  await Promise.all(
    Object.entries(playerStates).map(async ([playerId, playerState]) => {
      const doc = docMap.get(playerId);

      if (!doc) {
        const { playerId: _playerId, ...rest } = playerState;

        await ctx.db.insert("roundPlayerStates", {
          roundId,
          playerId: playerIdMap.get(playerId)!,
          ...rest,
        });
        return;
      }

      await ctx.db.patch(doc._id, {
        status: playerState.status,
        numberCards: playerState.numberCards,
        modifierCards: playerState.modifierCards,
        heldActionCards: playerState.heldActionCards,
        roundScore: playerState.roundScore,
        pointsAtRisk: playerState.pointsAtRisk,
        hasFlip7: playerState.hasFlip7,
      });
    }),
  );
}

export async function persistEvents(
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
    sequence += 1;
    await ctx.db.insert("roundEvents", {
      roundId,
      sequence,
      eventType: event.eventType,
      actorPlayerId: event.actorPlayerId ? playerIdMap.get(event.actorPlayerId) : undefined,
      targetPlayerId: event.targetPlayerId ? playerIdMap.get(event.targetPlayerId) : undefined,
      summary: event.summary,
      payload: event.payload,
      createdAt: Date.now(),
    });
  }
}

export async function persistScoreBreakdowns(
  ctx: MutationCtx,
  roundId: Id<"rounds">,
  playerStates: Record<string, PlayerRoundState>,
  playerIdMap: Map<string, Id<"players">>,
) {
  const existingBreakdowns = await ctx.db
    .query("scoreBreakdowns")
    .withIndex("by_round", (query) => query.eq("roundId", roundId))
    .collect();

  await Promise.all(existingBreakdowns.map((breakdown) => ctx.db.delete(breakdown._id)));

  await Promise.all(
    Object.entries(playerStates).map(async ([playerId, playerState]) => {
      const breakdown = scoreRound(
        playerState.numberCards,
        playerState.modifierCards,
        playerState.hasFlip7,
      );

      await ctx.db.insert("scoreBreakdowns", {
        roundId,
        playerId: playerIdMap.get(playerId)!,
        ...breakdown,
      });
    }),
  );
}

export function buildPlayerIdMap(players: Array<{ _id: Id<"players">; seatIndex: number }>) {
  return new Map(players.map((player) => [String(player._id), player._id]));
}

export function buildOrderedPlayers(players: Array<{ _id: Id<"players">; seatIndex: number }>) {
  return toOrderedPlayers(
    players.map((player) => ({
      playerId: String(player._id),
      seatIndex: player.seatIndex,
    })),
  );
}
