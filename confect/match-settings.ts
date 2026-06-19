import type { SessionId } from "convex-helpers/server/sessions";
import * as Effect from "effect/Effect";

import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import {
  gameSettingsEqual,
  normalizeAndValidateGameSettings,
  settingsFromMatch,
  type GameSettings,
} from "../game/logic/game-settings";
import {
  invalidMatchState,
  matchNotFound,
  notHost,
  staleGameState,
} from "../shared/lib/errors/domain";
import { snapshotForMatchSession } from "./match-snapshot-for-session";
import { toSessionId } from "./lib/session_functions";
import { getViewerPlayerIdWithReader } from "./lib/store";
import {
  DatabaseReader as DatabaseReaderService,
  DatabaseWriter as DatabaseWriterService,
} from "./_generated/services";

type DatabaseReader = Effect.Effect.Success<typeof DatabaseReaderService>;

function requireSetupMatchForSettings(match: Doc<"matches"> | null, matchId: Id<"matches">) {
  return Effect.gen(function* () {
    if (!match) {
      return yield* matchNotFound({ matchId: String(matchId) });
    }
    if (match.status !== "setup") {
      return yield* invalidMatchState();
    }
    return match;
  });
}

function requireHostAtExpectedVersion(
  reader: DatabaseReader,
  match: Doc<"matches">,
  matchId: Id<"matches">,
  sessionId: SessionId,
  expectedVersion: number,
) {
  return Effect.gen(function* () {
    const viewerPlayerId = yield* getViewerPlayerIdWithReader(reader, matchId, sessionId);

    if (!viewerPlayerId || match.hostPlayerId !== viewerPlayerId) {
      return yield* notHost();
    }

    if (match.version !== expectedVersion) {
      return yield* staleGameState({
        expectedVersion,
        actualVersion: match.version,
      });
    }

    return match;
  });
}

export function updateMatchSettingsForSession(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    sessionId: string;
    expectedVersion: number;
    patch: Partial<GameSettings>;
  },
) {
  const sessionId = toSessionId(args.sessionId);

  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;
    const writer = yield* DatabaseWriterService;

    const rawMatch = yield* reader.table("matches").get(args.matchId);
    const match = yield* requireSetupMatchForSettings(rawMatch, args.matchId);
    const authorizedMatch = yield* requireHostAtExpectedVersion(
      reader,
      match,
      args.matchId,
      sessionId,
      args.expectedVersion,
    );

    const currentSettings = settingsFromMatch(authorizedMatch);
    const nextSettings = normalizeAndValidateGameSettings({
      ...currentSettings,
      ...args.patch,
    });

    if (gameSettingsEqual(currentSettings, nextSettings)) {
      return yield* snapshotForMatchSession(ctx, args.matchId, sessionId);
    }

    yield* writer.table("matches").patch(args.matchId, {
      targetScore: nextSettings.targetScore,
      maxNumberCardValue: nextSettings.maxNumberCardValue,
      version: authorizedMatch.version + 1,
      updatedAt: Date.now(),
    });

    return yield* snapshotForMatchSession(ctx, args.matchId, sessionId);
  });
}
