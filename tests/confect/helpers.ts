import type { Ref } from "@confect/core";
import { Effect } from "effect";
import type { SessionId } from "convex-helpers/server/sessions";

import refs from "@/confect/_generated/refs";
import {
  describeReplayResult,
  type DeterministicStartOptions,
  type ReplayResult,
} from "@/tests/fixtures/deterministic";

import { TestConfect } from "./TestConfect";

type Snapshot = Ref.Returns<typeof refs.public.matches.getMatchSnapshot>;
let idempotencySequence = 0;

function commandMetadata(expectedVersion: number) {
  idempotencySequence += 1;
  return {
    expectedVersion,
    idempotencyKey: `confect-test-${idempotencySequence}`,
  };
}

export type SessionRecord = {
  name: string;
  sessionId: SessionId;
};

export function createStartedMatch(playerNames: string[]) {
  return createStartedMatchWithOptions(playerNames, {});
}

export function createStartedMatchWithOptions(
  playerNames: string[],
  options: { deterministicStart?: DeterministicStartOptions },
) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;

    const [hostName, ...guestNames] = playerNames;
    const sessions: SessionRecord[] = playerNames.map((name, index) => ({
      name,
      sessionId: `session-${index + 1}` as SessionId,
    }));

    const created = yield* client.mutation(refs.public.matches.createMatch, {
      hostName,
      sessionId: sessions[0]!.sessionId,
    });

    for (const [index, guestName] of guestNames.entries()) {
      yield* client.mutation(refs.public.matches.joinMatch, {
        matchId: created.matchId,
        playerName: guestName,
        sessionId: sessions[index + 1]!.sessionId,
      });
    }

    const started = yield* client.mutation(refs.public.matches.startMatch, {
      matchId: created.matchId,
      sessionId: sessions[0]!.sessionId,
      ...commandMetadata(created.version),
      deterministicStart: options.deterministicStart,
    });

    return {
      matchId: created.matchId,
      sessions,
      started,
    };
  });
}

export function startDeterministicNextRound(
  matchId: string,
  sessionId: SessionId,
  deterministicStart?: DeterministicStartOptions,
) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;
    const snapshot = yield* getSnapshotForAnySession(matchId, [{ sessionId, name: "Host" }]);
    return yield* client.mutation(refs.public.rounds.startNextRound, {
      matchId: matchId as never,
      sessionId,
      ...commandMetadata(snapshot?.version ?? 0),
      deterministicStart,
    });
  });
}

export function takeTurn(
  matchId: string,
  sessionId: SessionId,
  action: "hit" | "stay",
  expectedVersion: number,
) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;
    return yield* client.mutation(refs.public.turns.takeTurn, {
      matchId: matchId as never,
      sessionId,
      ...commandMetadata(expectedVersion),
      action,
    });
  });
}

export function resolveAction(
  matchId: string,
  sessionId: SessionId,
  targetPlayerId: string,
  expectedVersion: number,
) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;
    return yield* client.mutation(refs.public.turns.resolveAction, {
      matchId: matchId as never,
      sessionId,
      ...commandMetadata(expectedVersion),
      targetPlayerId: targetPlayerId as never,
    });
  });
}

export function describeConfectReplayResult(result: ReplayResult) {
  return `[confect] ${describeReplayResult(result)}`;
}

export function getSnapshotForAnySession(matchId: string, sessions: SessionRecord[]) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;

    for (const session of sessions) {
      const snapshot = yield* client.query(refs.public.matches.getMatchSnapshot, {
        matchId: matchId as never,
        sessionId: session.sessionId,
      });

      if (snapshot) {
        return snapshot;
      }
    }

    return null;
  });
}

export function advanceUntilRoundBoundary(matchId: string, sessions: SessionRecord[]) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;

    let snapshot: Snapshot = null;

    for (let guard = 0; guard < 50; guard += 1) {
      snapshot = (yield* getSnapshotForAnySession(matchId, sessions)) as Snapshot;

      if (!snapshot) {
        throw new Error("Expected a match snapshot while resolving gameplay");
      }

      if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
        return snapshot;
      }

      if (snapshot.pendingAction) {
        const sourceSession = sessions.find(
          (session) =>
            snapshot?.pendingAction?.sourcePlayerId ===
            snapshot?.players.find((player) => player.displayName === session.name)?.playerId,
        );

        if (!sourceSession) {
          throw new Error("Expected a source session for pending action");
        }

        snapshot = (yield* client.mutation(refs.public.turns.resolveAction, {
          matchId: matchId as never,
          targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
          sessionId: sourceSession.sessionId,
          ...commandMetadata(snapshot.version),
        })) as Snapshot;
        continue;
      }

      const activeSession = sessions.find(
        (session) =>
          snapshot?.activePlayerId ===
          snapshot?.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!activeSession) {
        throw new Error("Expected an active session while round is in progress");
      }

      snapshot = (yield* client.mutation(refs.public.turns.takeTurn, {
        matchId: matchId as never,
        action: "stay",
        sessionId: activeSession.sessionId,
        ...commandMetadata(snapshot.version),
      })) as Snapshot;
    }

    throw new Error("Timed out while advancing round state");
  });
}
