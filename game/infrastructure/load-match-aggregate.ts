import type { SessionId } from "convex-helpers/server/sessions";
import { getManyFrom } from "convex-helpers/server/relationships";
import { Effect } from "effect";

import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../../convex/_generated/server";
import { getPlayerIdForSession } from "../../confect/lib/session_store";
import type { OrderedPlayer, PlayerRoundState, RoundRuntime } from "../logic/round-state";
import { toOrderedPlayers } from "../logic/view-models";
import {
  getLatestRound,
  getRoundPlayerStateDocs,
  normalizePlayerRoundState,
  normalizeRoundRuntime,
} from "./snapshot-store";

type Ctx = QueryCtx | MutationCtx;

export type MatchAggregate = {
  match: Doc<"matches"> | null;
  players: Doc<"players">[];
  orderedPlayers: OrderedPlayer[];
  playerIdMap: Map<string, Id<"players">>;
  viewerPlayerId: Id<"players"> | null;
  latestRound: Doc<"rounds"> | null;
  roundRuntime: RoundRuntime | null;
  roundPlayerStateDocs: Doc<"roundPlayerStates">[];
  playerStates: Record<string, PlayerRoundState>;
};

function buildPlayerIdMap(players: Doc<"players">[]) {
  return new Map(players.map((player) => [String(player._id), player._id]));
}

export async function loadMatchAggregate(
  ctx: Ctx,
  matchId: Id<"matches">,
  sessionId: SessionId,
): Promise<MatchAggregate> {
  const match = await ctx.db.get(matchId);
  const players = match ? await getManyFrom(ctx.db, "players", "by_match", matchId, "matchId") : [];
  const orderedPlayers = toOrderedPlayers(
    players.map((player) => ({
      playerId: String(player._id),
      seatIndex: player.seatIndex,
    })),
  );
  const playerIdMap = buildPlayerIdMap(players);

  const sessionPlayerId = await Effect.runPromise(getPlayerIdForSession(ctx, sessionId));
  const viewerPlayerId =
    sessionPlayerId && players.some((player) => player._id === sessionPlayerId)
      ? sessionPlayerId
      : null;

  const latestRound = match ? await getLatestRound(ctx, matchId) : null;
  const roundPlayerStateDocs = latestRound
    ? await getRoundPlayerStateDocs(ctx, latestRound._id)
    : [];
  const playerStates = Object.fromEntries(
    roundPlayerStateDocs.map((doc) => {
      const playerState = normalizePlayerRoundState(doc);
      return [playerState.playerId, playerState];
    }),
  );

  return {
    match,
    players,
    orderedPlayers,
    playerIdMap,
    viewerPlayerId,
    latestRound,
    roundRuntime: latestRound ? normalizeRoundRuntime(latestRound) : null,
    roundPlayerStateDocs,
    playerStates,
  };
}
