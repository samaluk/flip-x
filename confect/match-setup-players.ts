import type { SessionId } from "convex-helpers/server/sessions";
import { Effect } from "effect";

import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { buildMatchCreatedAnalyticsEvent, buildMatchJoinedAnalyticsEvent } from "../game/application/match-setup-analytics";
import { DEFAULT_GAME_SETTINGS } from "../game/logic/game-settings";
import { captureAnalyticsEvents } from "../shared/analytics/service";
import {
  invalidHostName,
  invalidPlayerColor,
  invalidPlayerName,
  matchNotFound,
  nameAlreadyTaken,
  playerColorAlreadyTaken,
} from "../shared/lib/errors/domain";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "../shared/lib/player-colors";
import type { DatabaseReader, DatabaseWriter } from "./_generated/services";
import { generateUniqueLobbyCode, readMatchByLobbyCode } from "./match-lobby";
import { snapshotForMatchSession } from "./match-snapshot-for-session";
import { enforceRateLimit } from "./lib/rate_limiter";
import { toSessionId } from "./lib/session_functions";
import { setPlayerSessionWithServices } from "./lib/session_store";
import { getPlayersByMatchWithReader, getViewerPlayerIdWithReader } from "./lib/store";
import {
  DatabaseReader as DatabaseReaderService,
  DatabaseWriter as DatabaseWriterService,
} from "./_generated/services";

function normalizePlayerColorId(colorId: string | undefined, takenColorIds: string[]) {
  return Effect.gen(function* () {
    if (!colorId) {
      return firstAvailablePlayerColorId(takenColorIds);
    }

    if (!isPlayerColorId(colorId)) {
      return yield* invalidPlayerColor({ colorId });
    }

    if (takenColorIds.includes(colorId)) {
      return yield* playerColorAlreadyTaken({ colorId });
    }

    return colorId;
  });
}

function takenColorIdsExcludingViewer(
  players: readonly Doc<"players">[],
  existingViewerPlayerId: Id<"players"> | null,
): PlayerColorId[] {
  return players.reduce<PlayerColorId[]>((colorIds, player) => {
    const colorId = player.colorId;
    if (
      (!existingViewerPlayerId || player._id !== existingViewerPlayerId) &&
      colorId !== undefined &&
      isPlayerColorId(colorId)
    ) {
      colorIds.push(colorId);
    }
    return colorIds;
  }, []);
}

function assertMatchJoinable(reader: DatabaseReader, matchId: Id<"matches">) {
  return Effect.gen(function* () {
    const match = yield* reader.table("matches").get(matchId);
    if (!match || match.status === "completed") {
      return yield* matchNotFound({ matchId: String(matchId) });
    }
    return undefined;
  });
}

function requireValidJoinPlayerName(rawName: string) {
  return Effect.gen(function* () {
    const playerName = rawName.trim();
    if (!playerName || playerName.length > 20) {
      return yield* invalidPlayerName();
    }
    return playerName;
  });
}

type PreparedJoinPlayers = {
  players: readonly Doc<"players">[];
  existingViewerPlayerId: Id<"players"> | null;
  playerName: string;
  playerColorId: string;
};

function prepareJoinPlayersState(
  reader: DatabaseReader,
  matchId: Id<"matches">,
  sessionId: SessionId,
  rawPlayerName: string,
  requestedColorId: string | undefined,
) {
  return Effect.gen(function* () {
    yield* assertMatchJoinable(reader, matchId);
    const playerName = yield* requireValidJoinPlayerName(rawPlayerName);
    const players = yield* getPlayersByMatchWithReader(reader, matchId);
    const existingViewerPlayerId = yield* getViewerPlayerIdWithReader(reader, matchId, sessionId);
    const takenColorIds = takenColorIdsExcludingViewer(players, existingViewerPlayerId);
    const playerColorId = yield* normalizePlayerColorId(requestedColorId, takenColorIds);
    return {
      players,
      existingViewerPlayerId,
      playerName,
      playerColorId,
    } satisfies PreparedJoinPlayers;
  });
}

function joinReturningPlayerSnapshot(
  ctx: MutationCtx,
  writer: DatabaseWriter,
  matchId: Id<"matches">,
  sessionId: SessionId,
  players: readonly Doc<"players">[],
  existingViewerPlayerId: Id<"players">,
  playerName: string,
  playerColorId: string,
) {
  return Effect.gen(function* () {
    const existingViewerPlayer = players.find((player) => player._id === existingViewerPlayerId);
    if (!existingViewerPlayer) {
      return yield* matchNotFound({ matchId: String(matchId) });
    }

    const nameTakenByOther =
      existingViewerPlayer.displayName.toLowerCase() !== playerName.toLowerCase() &&
      players.some((player) => player.displayName.toLowerCase() === playerName.toLowerCase());
    if (nameTakenByOther) {
      return yield* nameAlreadyTaken({ name: playerName });
    }

    yield* writer
      .table("players")
      .patch(existingViewerPlayerId, { displayName: playerName, colorId: playerColorId });

    return yield* snapshotForMatchSession(ctx, matchId, sessionId);
  });
}

function joinNewPlayerSnapshot(
  ctx: MutationCtx,
  reader: DatabaseReader,
  writer: DatabaseWriter,
  matchId: Id<"matches">,
  sessionId: SessionId,
  players: readonly Doc<"players">[],
  playerName: string,
  playerColorId: string,
) {
  return Effect.gen(function* () {
    const existingNames = new Set(players.map((player) => player.displayName.toLowerCase()));
    if (existingNames.has(playerName.toLowerCase())) {
      return yield* nameAlreadyTaken({ name: playerName });
    }

    const nextSeat =
      players.length === 0 ? 0 : Math.max(...players.map((player) => player.seatIndex)) + 1;
    const playerId = yield* writer.table("players").insert({
      matchId,
      displayName: playerName,
      colorId: playerColorId,
      seatIndex: nextSeat,
      totalScore: 0,
      hasWon: false,
    });

    yield* setPlayerSessionWithServices(reader, writer, sessionId, playerId);

    yield* captureAnalyticsEvents([
      buildMatchJoinedAnalyticsEvent({
        sessionId,
        matchId,
        playerId,
        seatIndex: nextSeat,
        playerCount: players.length + 1,
      }),
    ]);

    return yield* snapshotForMatchSession(ctx, matchId, sessionId);
  });
}

export function createMatchForSession(
  ctx: MutationCtx,
  args: { hostName: string; hostColorId?: string; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;
    const writer = yield* DatabaseWriterService;

    yield* enforceRateLimit(ctx, "createMatch", args.sessionId);

    const hostName = args.hostName.trim();

    if (!hostName || hostName.length > 20) {
      return yield* invalidHostName();
    }

    const hostColorId = yield* normalizePlayerColorId(args.hostColorId, []);

    const timestamp = Date.now();
    const lobbyCode = yield* generateUniqueLobbyCode((code) => readMatchByLobbyCode(reader, code));
    const matchId = yield* writer.table("matches").insert({
      status: "setup",
      lobbyCode,
      targetScore: DEFAULT_GAME_SETTINGS.targetScore,
      maxNumberCardValue: DEFAULT_GAME_SETTINGS.maxNumberCardValue,
      currentRoundNumber: 0,
      dealerSeat: 0,
      version: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const hostPlayerId = yield* writer.table("players").insert({
      matchId,
      displayName: hostName,
      colorId: hostColorId,
      seatIndex: 0,
      totalScore: 0,
      hasWon: false,
    });

    yield* setPlayerSessionWithServices(reader, writer, sessionId, hostPlayerId);
    yield* writer.table("matches").patch(matchId, { hostPlayerId });

    yield* captureAnalyticsEvents([
      buildMatchCreatedAnalyticsEvent({
        sessionId,
        matchId,
        hostPlayerId,
        targetScore: DEFAULT_GAME_SETTINGS.targetScore,
        maxNumberCardValue: DEFAULT_GAME_SETTINGS.maxNumberCardValue,
      }),
    ]);

    return yield* snapshotForMatchSession(ctx, matchId, sessionId);
  });
}

export function joinMatchForSession(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; playerName: string; playerColorId?: string; sessionId: string },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;
    const writer = yield* DatabaseWriterService;

    yield* enforceRateLimit(ctx, "joinMatch", args.sessionId);

    const prepared = yield* prepareJoinPlayersState(
      reader,
      args.matchId,
      sessionId,
      args.playerName,
      args.playerColorId,
    );

    if (prepared.existingViewerPlayerId) {
      return yield* joinReturningPlayerSnapshot(
        ctx,
        writer,
        args.matchId,
        sessionId,
        prepared.players,
        prepared.existingViewerPlayerId,
        prepared.playerName,
        prepared.playerColorId,
      );
    }

    return yield* joinNewPlayerSnapshot(
      ctx,
      reader,
      writer,
      args.matchId,
      sessionId,
      prepared.players,
      prepared.playerName,
      prepared.playerColorId,
    );
  });
}
