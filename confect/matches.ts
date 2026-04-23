import { v } from "convex/values";
import type { SessionId } from "convex-helpers/server/sessions";
import { getOneFrom } from "convex-helpers/server/relationships";

import type { Card } from "../game/logic/card-types";
import { generateLobbyCode } from "../shared/lib/lobby-code";
import { enforceRateLimit } from "./lib/rate_limiter";
import { mutationWithSession, queryWithSession } from "./lib/session_functions";
import { setPlayerSession } from "./lib/session_store";
import type { Id } from "../convex/_generated/dataModel";
import { getPlayersByMatch, getViewerPlayerId } from "./lib/store";
import type { MutationCtx } from "../convex/_generated/server";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "../shared/lib/player-colors";
import {
  InvalidHostName,
  InvalidPlayerColor,
  InvalidPlayerName,
  LobbyCodeUnavailable,
  LobbyNotFound,
  MatchNotFound,
  NameAlreadyTaken,
  PlayerColorAlreadyTaken,
} from "../shared/lib/errors/domain";
import { runGameCommand } from "../game/application/run-command";
import { buildSnapshot, getLatestRound } from "../game/infrastructure/snapshot-store";

async function generateUniqueLobbyCode(ctx: MutationCtx) {
  let lobbyCode = generateLobbyCode();
  let existing = await ctx.db
    .query("matches")
    .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
    .first();
  let attempts = 0;

  while (existing && attempts < 10) {
    lobbyCode = generateLobbyCode();
    existing = await ctx.db
      .query("matches")
      .withIndex("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
      .first();
    attempts += 1;
  }

  if (existing) {
    throw new LobbyCodeUnavailable();
  }

  return lobbyCode;
}

export async function createMatchForSession(
  ctx: MutationCtx,
  args: { hostName: string; hostColorId?: string; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  await enforceRateLimit(ctx, "createMatch", String(args.sessionId));

  const hostName = args.hostName.trim();

  if (!hostName || hostName.length > 20) {
    throw new InvalidHostName();
  }

  const hostColorId = normalizePlayerColorId(args.hostColorId, []);

  const timestamp = Date.now();
  const lobbyCode = await generateUniqueLobbyCode(ctx);
  const matchId = await ctx.db.insert("matches", {
    status: "setup",
    lobbyCode,
    targetScore: 200,
    currentRoundNumber: 0,
    dealerSeat: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const hostPlayerId = await ctx.db.insert("players", {
    matchId,
    displayName: hostName,
    colorId: hostColorId,
    seatIndex: 0,
    totalScore: 0,
    hasWon: false,
  });

  await setPlayerSession(ctx, sessionId, hostPlayerId);
  await ctx.db.patch(matchId, { hostPlayerId });

  const match = await ctx.db.get(matchId);
  if (!match) {
    throw new MatchNotFound({ matchId: String(matchId) });
  }

  return await buildSnapshot(ctx, match, null, sessionId);
}

export async function joinByCodeForSession(
  ctx: MutationCtx,
  args: { lobbyCode: string; sessionId: string },
) {
  await enforceRateLimit(ctx, "joinByCode", String(args.sessionId));

  const normalized = args.lobbyCode.trim().toUpperCase();
  if (normalized.length !== 4) {
    throw new LobbyNotFound();
  }

  const match = await ctx.db
    .query("matches")
    .withIndex("by_lobby_code", (q) => q.eq("lobbyCode", normalized))
    .first();

  if (!match || match.status !== "setup") {
    throw new LobbyNotFound();
  }

  return {
    matchId: String(match._id),
    lobbyCode: match.lobbyCode,
  };
}

export const createMatch = mutationWithSession({
  args: {
    hostName: v.string(),
    hostColorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await createMatchForSession(ctx, args),
});

export const getCurrentPlayer = queryWithSession({
  args: {},
  handler: async (ctx, args) => {
    const playerSession = await getOneFrom(
      ctx.db,
      "playerSessions",
      "by_session_id",
      args.sessionId,
      "sessionId",
    );

    if (!playerSession) {
      return null;
    }

    const player = await ctx.db.get(playerSession.playerId);
    if (!player) {
      return null;
    }

    return {
      displayName: player.displayName,
    };
  },
});

export const getMatchSnapshot = queryWithSession({
  args: {
    matchId: v.id("matches"),
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

export const joinByCode = mutationWithSession({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => await joinByCodeForSession(ctx, args),
});

export async function joinMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; playerColorId?: string; sessionId: string },
) {
  const sessionId = args.sessionId as SessionId;

  await enforceRateLimit(ctx, "joinMatch", String(args.sessionId));

  const match = await ctx.db.get(args.matchId);

  if (!match || match.status !== "setup") {
    throw new MatchNotFound({ matchId: String(args.matchId) });
  }

  const playerName = args.playerName.trim();
  if (!playerName || playerName.length > 20) {
    throw new InvalidPlayerName();
  }

  const players = await getPlayersByMatch(ctx, args.matchId);
  const existingViewerPlayerId = await getViewerPlayerId(ctx, args.matchId, sessionId);
  const takenColorIds = players
    .filter((player) => !existingViewerPlayerId || player._id !== existingViewerPlayerId)
    .map((player) => player.colorId)
    .filter((colorId): colorId is PlayerColorId => isPlayerColorId(colorId ?? ""));
  const playerColorId = normalizePlayerColorId(args.playerColorId, takenColorIds);

  if (existingViewerPlayerId) {
    const existingViewerPlayer = players.find((player) => player._id === existingViewerPlayerId);
    if (!existingViewerPlayer) {
      throw new MatchNotFound({ matchId: String(args.matchId) });
    }

    if (
      existingViewerPlayer.displayName.toLowerCase() !== playerName.toLowerCase() &&
      players.some((player) => player.displayName.toLowerCase() === playerName.toLowerCase())
    ) {
      throw new NameAlreadyTaken({ name: playerName });
    }

    await ctx.db.patch(existingViewerPlayerId, { displayName: playerName, colorId: playerColorId });
    const round = await getLatestRound(ctx, args.matchId);
    const nextMatch = await ctx.db.get(args.matchId);

    if (!nextMatch) {
      throw new MatchNotFound({ matchId: String(args.matchId) });
    }

    return await buildSnapshot(ctx, nextMatch, round, sessionId);
  }

  const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
  if (existingNames.has(playerName.toLowerCase())) {
    throw new NameAlreadyTaken({ name: playerName });
  }

  const nextSeat =
    players.length === 0 ? 0 : Math.max(...players.map((player) => player.seatIndex)) + 1;
  const playerId = await ctx.db.insert("players", {
    matchId: args.matchId,
    displayName: playerName,
    colorId: playerColorId,
    seatIndex: nextSeat,
    totalScore: 0,
    hasWon: false,
  });

  await setPlayerSession(ctx, sessionId, playerId);

  const round = await getLatestRound(ctx, args.matchId);
  return await buildSnapshot(ctx, match, round, sessionId);
}

export const joinMatch = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerName: v.string(),
    playerColorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await joinMatchForSession(ctx, args),
});

function normalizePlayerColorId(colorId: string | undefined, takenColorIds: string[]) {
  if (!colorId) {
    return firstAvailablePlayerColorId(takenColorIds);
  }

  if (!isPlayerColorId(colorId)) {
    throw new InvalidPlayerColor({ colorId });
  }

  if (takenColorIds.includes(colorId)) {
    throw new PlayerColorAlreadyTaken({ colorId });
  }

  return colorId;
}

export async function startMatchForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    deterministicStart?: { roundSeed: { drawPile: Card[] } };
  },
) {
  const sessionId = args.sessionId as SessionId;

  await enforceRateLimit(ctx, "startMatch", String(args.sessionId));

  return await runGameCommand(ctx, {
    matchId: args.matchId,
    sessionId,
    command: {
      type: "START_MATCH",
      deterministicStart: args.deterministicStart,
    },
  });
}
