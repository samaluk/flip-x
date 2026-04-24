import type { SessionId } from "convex-helpers/server/sessions";
import { getManyFrom } from "convex-helpers/server/relationships";

import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import { getPlayerIdForSession } from "../../confect/lib/session_store";
import { buildMatchSnapshot, toCanonicalReplayStepState } from "../logic/view-models";
import { buildRoundHistory } from "./round-history-builder";
import type { ActionCard, Card } from "../logic/card-types";
import { isRoundEventType, type RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";
import type { MatchSnapshot } from "../logic/view-models";

type Ctx = QueryCtx | MutationCtx;

export function normalizePlayerRoundState(doc: Doc<"roundPlayerStates">): PlayerRoundState {
  return {
    playerId: String(doc.playerId),
    status: doc.status,
    numberCards: doc.numberCards as PlayerRoundState["numberCards"],
    modifierCards: doc.modifierCards as PlayerRoundState["modifierCards"],
    heldActionCards: doc.heldActionCards as PlayerRoundState["heldActionCards"],
    receivedActionCards: doc.receivedActionCards as PlayerRoundState["receivedActionCards"],
    roundScore: doc.roundScore,
    pointsAtRisk: doc.pointsAtRisk,
    hasFlip7: doc.hasFlip7,
    bustCard: doc.bustCard ? (doc.bustCard as PlayerRoundState["bustCard"]) : null,
  };
}

export function normalizeRoundRuntime(doc: Doc<"rounds">): RoundRuntime {
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
    pendingFlip3: doc.pendingFlip3
      ? {
          sourcePlayerId: String(doc.pendingFlip3.sourcePlayerId),
          targetPlayerId: String(doc.pendingFlip3.targetPlayerId),
          cardsRemaining: doc.pendingFlip3.cardsRemaining,
          deferredActionCards: doc.pendingFlip3.deferredActionCards as ActionCard[],
        }
      : null,
  };
}

function normalizeLatestRoundEvent(doc: Doc<"roundEvents">): RoundEvent {
  if (!isRoundEventType(doc.eventType)) {
    throw new Error(`Unknown round event type: ${doc.eventType}`);
  }

  return {
    eventType: doc.eventType,
    actorPlayerId: doc.actorPlayerId ? String(doc.actorPlayerId) : null,
    targetPlayerId: doc.targetPlayerId ? String(doc.targetPlayerId) : null,
    payload:
      typeof doc.payload === "object" && doc.payload
        ? (doc.payload as Record<string, unknown>)
        : {},
  } as RoundEvent;
}

export async function getLatestRound(ctx: Ctx, matchId: Id<"matches">) {
  const rounds = await getManyFrom(ctx.db, "rounds", "by_match", matchId, "matchId");
  return rounds.toSorted((left, right) => right.roundNumber - left.roundNumber)[0] ?? null;
}

export async function getRoundPlayerStateDocs(ctx: Ctx, roundId: Id<"rounds">) {
  return await getManyFrom(ctx.db, "roundPlayerStates", "by_round", roundId, "roundId");
}

export async function getLatestRoundEvent(ctx: Ctx, roundId: Id<"rounds">) {
  const events = await getManyFrom(ctx.db, "roundEvents", "by_round", roundId, "roundId");
  return events.toSorted((left, right) => right.sequence - left.sequence)[0] ?? null;
}

export async function buildSnapshot(
  ctx: Ctx,
  match: Doc<"matches">,
  round: Doc<"rounds"> | null,
  sessionId?: SessionId,
): Promise<MatchSnapshot> {
  const players = await getManyFrom(ctx.db, "players", "by_match", match._id, "matchId");
  const playerId = await getPlayerIdForSession(ctx, sessionId);
  const viewerPlayerId =
    playerId && players.some((player) => player._id === playerId) ? String(playerId) : null;

  let playerStates: Record<string, PlayerRoundState> = {};
  let latestEvent: RoundEvent | null = null;

  if (round) {
    const roundPlayerStateDocs = await getRoundPlayerStateDocs(ctx, round._id);
    playerStates = Object.fromEntries(
      roundPlayerStateDocs.map((doc) => {
        const playerState = normalizePlayerRoundState(doc);
        return [playerState.playerId, playerState];
      }),
    );

    const latestRoundEvent = await getLatestRoundEvent(ctx, round._id);
    latestEvent = latestRoundEvent ? normalizeLatestRoundEvent(latestRoundEvent) : null;
  }

  const roundHistory = await buildRoundHistory(
    ctx,
    match._id,
    match.targetScore,
    match.currentRoundNumber,
    match.status,
    players.map((p) => ({
      playerId: String(p._id),
      totalScore: p.totalScore,
      seatIndex: p.seatIndex,
    })),
  );

  return buildMatchSnapshot({
    matchId: String(match._id),
    status: match.status,
    lobbyCode: match.lobbyCode,
    hostPlayerId: match.hostPlayerId ? String(match.hostPlayerId) : null,
    targetScore: match.targetScore,
    currentRoundNumber: match.currentRoundNumber,
    dealerSeat: match.dealerSeat,
    viewerPlayerId,
    round: round ? normalizeRoundRuntime(round) : null,
    players: players.map((player) => ({
      playerId: String(player._id),
      displayName: player.displayName,
      colorId: player.colorId,
      seatIndex: player.seatIndex,
      totalScore: player.totalScore,
      isOnline: false,
    })),
    playerStates,
    latestEvent,
    roundHistory,
  });
}

export async function buildLatestMatchSnapshot(
  ctx: Ctx,
  matchId: Id<"matches">,
  sessionId?: SessionId,
): Promise<MatchSnapshot | null> {
  const match = await ctx.db.get(matchId);
  if (!match) {
    return null;
  }

  const round = await getLatestRound(ctx, matchId);
  return await buildSnapshot(ctx, match, round, sessionId);
}

export async function buildCanonicalReplayStepState(
  ctx: Ctx,
  match: Doc<"matches">,
  round: Doc<"rounds"> | null,
  sessionId?: SessionId,
) {
  const snapshot = await buildSnapshot(ctx, match, round, sessionId);
  return toCanonicalReplayStepState(snapshot);
}
