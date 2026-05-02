import type { SessionId } from "convex-helpers/server/sessions";
import { getManyFrom } from "convex-helpers/server/relationships";
import { Effect } from "effect";

import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import { getPlayerIdForSession } from "../../confect/lib/session_store";
import { buildMatchSnapshot } from "../logic/view-models";
import { settingsFromMatch } from "../logic/game-settings";
import { buildRoundHistory } from "./round-history-builder";
import type { RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";
import type { MatchSnapshot } from "../logic/view-models";
import {
  deserializePlayerRoundState,
  deserializeRoundEvent,
  deserializeRoundRuntime,
} from "./serializers";

type Ctx = QueryCtx | MutationCtx;

export function normalizePlayerRoundState(doc: Doc<"roundPlayerStates">): PlayerRoundState {
  return deserializePlayerRoundState(doc);
}

export function normalizeRoundRuntime(doc: Doc<"rounds">): RoundRuntime {
  return deserializeRoundRuntime(doc);
}

function normalizeLatestRoundEvent(doc: Doc<"roundEvents">): RoundEvent {
  return deserializeRoundEvent(doc);
}

export async function getLatestRound(ctx: Ctx, matchId: Id<"matches">) {
  const rounds = await getManyFrom(ctx.db, "rounds", "by_match", matchId, "matchId");
  return rounds.toSorted((left, right) => right.roundNumber - left.roundNumber)[0] ?? null;
}

export async function getRoundPlayerStateDocs(ctx: Ctx, roundId: Id<"rounds">) {
  return await getManyFrom(ctx.db, "roundPlayerStates", "by_round", roundId, "roundId");
}

async function getLatestRoundEvent(ctx: Ctx, roundId: Id<"rounds">) {
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
  const playerId = await Effect.runPromise(getPlayerIdForSession(ctx, sessionId));
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
    version: match.version,
    lobbyCode: match.lobbyCode,
    hostPlayerId: match.hostPlayerId ? String(match.hostPlayerId) : null,
    targetScore: match.targetScore,
    settings: settingsFromMatch(match),
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
