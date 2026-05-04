import type { Ref } from "@confect/core";
import { Effect, Schema } from "effect";
import type { SessionId } from "convex-helpers/server/sessions";

import refs from "@/confect/_generated/refs";
import type { Id } from "@/convex/_generated/dataModel";
import { MatchSnapshot } from "@/confect/match-snapshot-schema";
import { MutationCtx } from "@/confect/_generated/services";
import { runGameCommand } from "@/game/application/run-command";

type RunGameCommandInput = Parameters<typeof runGameCommand>[1];
import {
  classifyRoundBoundaryAdvanceStepOrThrow,
  describeReplayResult,
  requireActiveSessionForSnapshot,
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

export { requireActiveSessionForSnapshot };

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

export function runCommand(
  matchId: string,
  sessionId: SessionRecord["sessionId"],
  command: RunGameCommandInput["command"],
) {
  return Effect.gen(function* () {
    const client = yield* TestConfect;
    return yield* client.run(
      Effect.gen(function* () {
        const ctx = (yield* MutationCtx) as unknown as Parameters<typeof runGameCommand>[0];
        return yield* runGameCommand(ctx, {
          matchId: matchId as never,
          sessionId,
          command,
        });
      }),
      MatchSnapshot as never,
    );
  });
}

export function driveMatchUntilCompleted(
  matchId: string,
  sessions: SessionRecord[],
  initialSnapshot: NonNullable<Snapshot>,
) {
  return Effect.gen(function* () {
    let finalSnapshot = initialSnapshot;

    for (let guard = 0; guard < 150 && finalSnapshot.status !== "completed"; guard += 1) {
      if (finalSnapshot.roundStatus === "completed" && finalSnapshot.status === "in_progress") {
        finalSnapshot = yield* runCommand(matchId, sessions[0]!.sessionId, {
          type: "START_NEXT_ROUND",
          expectedVersion: finalSnapshot.version,
          idempotencyKey: `runner-finalize-next-round-${guard}`,
        });
        continue;
      }

      if (finalSnapshot.pendingAction) {
        const sourceSession = sessions.find(
          (session) =>
            finalSnapshot.pendingAction?.sourcePlayerId ===
            finalSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
        );
        if (!sourceSession) {
          throw new Error("Expected a source session while completing the round");
        }

        finalSnapshot = yield* runCommand(matchId, sourceSession.sessionId, {
          type: "RESOLVE_ACTION",
          expectedVersion: finalSnapshot.version,
          idempotencyKey: `runner-finalize-resolve-${guard}`,
          targetPlayerId: finalSnapshot.pendingAction.eligibleTargetIds[0]!,
        });
        continue;
      }

      const activeSession = sessions.find(
        (session) =>
          finalSnapshot.activePlayerId ===
          finalSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );
      if (!activeSession) {
        break;
      }

      const flip3 = finalSnapshot.pendingFlip3;
      const mustHitFlip3 =
        flip3 !== null &&
        flip3.cardsRemaining > 0 &&
        flip3.targetPlayerId === finalSnapshot.activePlayerId;

      finalSnapshot = yield* runCommand(matchId, activeSession.sessionId, {
        type: "TAKE_TURN",
        expectedVersion: finalSnapshot.version,
        idempotencyKey: `runner-finalize-turn-${guard}`,
        action: mustHitFlip3 ? "hit" : "stay",
      });
    }

    return finalSnapshot;
  });
}

export function readRoundState(matchId: string) {
  const RoundStateSummary = Schema.Struct({
    eventTypes: Schema.Array(Schema.String),
    scoreBreakdownCount: Schema.Number,
    matchStatus: Schema.String,
    winnerPlayerId: Schema.NullOr(Schema.String),
    players: Schema.Array(
      Schema.Struct({
        playerId: Schema.String,
        displayName: Schema.String,
        totalScore: Schema.Number,
        hasWon: Schema.Boolean,
      }),
    ),
  });

  return Effect.gen(function* () {
    const client = yield* TestConfect;
    return yield* client.run(
      Effect.gen(function* () {
        const ctx = (yield* MutationCtx) as unknown as Parameters<typeof runGameCommand>[0];
        const round = yield* Effect.promise(() =>
          ctx.db
            .query("rounds")
            .withIndex("by_match", (query) => query.eq("matchId", matchId as never))
            .order("desc")
            .first(),
        );

        const events = round
          ? yield* Effect.promise(() =>
              ctx.db
                .query("roundEvents")
                .withIndex("by_round", (query) => query.eq("roundId", round._id))
                .collect(),
            )
          : [];
        const scoreBreakdowns = round
          ? yield* Effect.promise(() =>
              ctx.db
                .query("scoreBreakdowns")
                .withIndex("by_round", (query) => query.eq("roundId", round._id))
                .collect(),
            )
          : [];
        const match = yield* Effect.promise(() => ctx.db.get(matchId as Id<"matches">));
        const players = yield* Effect.promise(() =>
          ctx.db
            .query("players")
            .withIndex("by_match", (query) => query.eq("matchId", matchId as Id<"matches">))
            .collect(),
        );

        return {
          eventTypes: events.map((event) => event.eventType),
          scoreBreakdownCount: scoreBreakdowns.length,
          matchStatus: match?.status ?? "missing",
          winnerPlayerId: match?.winnerPlayerId ? String(match.winnerPlayerId) : null,
          players: players
            .toSorted((left, right) => left.seatIndex - right.seatIndex)
            .map((player) => ({
              playerId: String(player._id),
              displayName: player.displayName,
              totalScore: player.totalScore,
              hasWon: player.hasWon,
            })),
        };
      }),
      RoundStateSummary as never,
    );
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

      const step = classifyRoundBoundaryAdvanceStepOrThrow(snapshot, sessions);
      if (step.kind === "terminal") {
        return step.snapshot;
      }
      if (step.kind === "pending-action") {
        snapshot = (yield* client.mutation(refs.public.turns.resolveAction, {
          matchId: matchId as never,
          targetPlayerId: step.snapshot.pendingAction!.eligibleTargetIds[0]!,
          sessionId: step.sourceSession.sessionId,
          ...commandMetadata(step.snapshot.version),
        })) as Snapshot;
        continue;
      }

      const activeSession = requireActiveSessionForSnapshot(
        step.snapshot,
        sessions,
        "Expected an active session while round is in progress",
      );

      snapshot = (yield* client.mutation(refs.public.turns.takeTurn, {
        matchId: matchId as never,
        action: step.snapshot.pendingFlip3 ? "hit" : "stay",
        sessionId: activeSession.sessionId,
        ...commandMetadata(step.snapshot.version),
      })) as Snapshot;
    }

    throw new Error("Timed out while advancing round state");
  });
}
