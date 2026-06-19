import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

import type { Doc } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { generateLobbyCode } from "../shared/lib/lobby-code";
import { lobbyCodeUnavailable, lobbyNotFound } from "../shared/lib/errors/domain";
import { enforceRateLimit } from "./lib/rate_limiter";
import { getPlayersByMatchWithReader } from "./lib/store";
import { DatabaseReader as DatabaseReaderService } from "./_generated/services";

type DatabaseReader = Effect.Effect.Success<typeof DatabaseReaderService>;

function resolveUniqueLobbyCodeAttempt(
  lookupMatchByLobbyCode: (lobbyCode: string) => Effect.Effect<Doc<"matches"> | null, unknown>,
  initialLobbyCode: string,
) {
  return Effect.gen(function* () {
    let lobbyCode = initialLobbyCode;
    let existing = yield* lookupMatchByLobbyCode(lobbyCode);
    let attempts = 0;

    while (existing && attempts < 10) {
      lobbyCode = generateLobbyCode();
      existing = yield* lookupMatchByLobbyCode(lobbyCode);
      attempts += 1;
    }

    return { lobbyCode, existing } as const;
  });
}

export function readMatchByLobbyCode(reader: DatabaseReader, lobbyCode: string) {
  return reader
    .table("matches")
    .index("by_lobby_code", (query) => query.eq("lobbyCode", lobbyCode))
    .first()
    .pipe(Effect.map(Option.getOrNull));
}

export function generateUniqueLobbyCode(
  lookupMatchByLobbyCode: (lobbyCode: string) => Effect.Effect<Doc<"matches"> | null, unknown>,
) {
  return Effect.gen(function* () {
    const { lobbyCode, existing } = yield* resolveUniqueLobbyCodeAttempt(
      lookupMatchByLobbyCode,
      generateLobbyCode(),
    );

    if (existing) {
      return yield* lobbyCodeUnavailable();
    }

    return lobbyCode;
  });
}

function getJoinableMatchByLobbyCode(
  lookupMatchByLobbyCode: (lobbyCode: string) => Effect.Effect<Doc<"matches"> | null, unknown>,
  lobbyCode: string,
) {
  return Effect.gen(function* () {
    const match = yield* lookupMatchByLobbyCode(lobbyCode);

    if (!match || match.status === "completed") {
      return yield* lobbyNotFound();
    }

    return match;
  });
}

export function getMatchByCode(ctx: QueryCtx, lobbyCode: string) {
  const normalized = lobbyCode.trim().toUpperCase();
  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;

    if (normalized.length !== 4) {
      return null;
    }

    const match = yield* readMatchByLobbyCode(reader, normalized);

    if (!match || match.status === "completed") {
      return null;
    }

    const players = yield* getPlayersByMatchWithReader(reader, match._id);

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
      status: match.status,
      usedColorIds: players
        .map((player) => player.colorId)
        .filter((colorId): colorId is string => typeof colorId === "string"),
    };
  });
}

export function joinByCodeForSession(
  ctx: MutationCtx,
  args: { lobbyCode: string; sessionId: string },
) {
  return Effect.gen(function* () {
    const reader = yield* DatabaseReaderService;

    yield* enforceRateLimit(ctx, "joinByCode", args.sessionId);

    const normalized = args.lobbyCode.trim().toUpperCase();
    if (normalized.length !== 4) {
      return yield* lobbyNotFound();
    }

    const match = yield* getJoinableMatchByLobbyCode(
      (lobbyCode) => readMatchByLobbyCode(reader, lobbyCode),
      normalized,
    );

    return {
      matchId: String(match._id),
      lobbyCode: match.lobbyCode,
    };
  });
}
