import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import refs from "@/confect/_generated/refs";
import {
  MATCH_REPLAY_SCENARIO,
  ROUND_REPLAY_SCENARIO,
  cloneReplayScenario,
  runDeterministicReplayScenario,
  type ReplayHarness,
} from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";

let idempotencySequence = 0;

function commandMetadata(expectedVersion: number) {
  idempotencySequence += 1;
  return {
    expectedVersion,
    idempotencyKey: `confect-replay-${idempotencySequence}`,
  };
}

describe("Confect deterministic replay", () => {
  it.effect("replays a deterministic full match step-by-step", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const harness: ReplayHarness = {
        createStartedMatch: async (playerNames, options) => {
          const [hostName, ...guestNames] = playerNames;
          const sessions = playerNames.map((name, index) => ({
            name,
            sessionId: `session-${index + 1}`,
          }));
          const created = await Effect.runPromise(
            client.mutation(refs.public.matches.createMatch, {
              hostName,
              sessionId: sessions[0]!.sessionId as never,
            }),
          );
          for (const [index, guestName] of guestNames.entries()) {
            await Effect.runPromise(
              client.mutation(refs.public.matches.joinMatch, {
                matchId: created.matchId,
                playerName: guestName,
                sessionId: sessions[index + 1]!.sessionId as never,
              }),
            );
          }
          const started = await Effect.runPromise(
            client.mutation(refs.public.matches.startMatch, {
              matchId: created.matchId,
              sessionId: sessions[0]!.sessionId as never,
              ...commandMetadata(created.version),
              deterministicStart: options.deterministicStart,
            }),
          );
          return { matchId: created.matchId, sessions, started };
        },
        advanceUntilRoundBoundary: async (matchId, sessions) => {
          for (let guard = 0; guard < 50; guard += 1) {
            let snapshot = null;
            for (const session of sessions) {
              snapshot = await Effect.runPromise(
                client.query(refs.public.matches.getMatchSnapshot, {
                  matchId: matchId as never,
                  sessionId: session.sessionId as never,
                }),
              );
              if (snapshot) break;
            }
            if (!snapshot) {
              throw new Error("Expected a match snapshot while resolving gameplay");
            }
            if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
              return snapshot;
            }
            if (snapshot.pendingAction) {
              const sourceSession = sessions.find(
                (session) =>
                  snapshot.pendingAction?.sourcePlayerId ===
                  snapshot.players.find((player) => player.displayName === session.name)?.playerId,
              );
              if (!sourceSession) {
                throw new Error("Expected a source session for pending action");
              }
              await Effect.runPromise(
                client.mutation(refs.public.turns.resolveAction, {
                  matchId: matchId as never,
                  targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
                  sessionId: sourceSession.sessionId as never,
                  ...commandMetadata(snapshot.version),
                }),
              );
              continue;
            }
            const activeSession = sessions.find(
              (session) =>
                snapshot.activePlayerId ===
                snapshot.players.find((player) => player.displayName === session.name)?.playerId,
            );
            if (!activeSession) {
              throw new Error("Expected an active session while round is in progress");
            }
            await Effect.runPromise(
              client.mutation(refs.public.turns.takeTurn, {
                matchId: matchId as never,
                action: "stay",
                sessionId: activeSession.sessionId as never,
                ...commandMetadata(snapshot.version),
              }),
            );
          }
          throw new Error("Timed out while advancing round state");
        },
        startDeterministicNextRound: async (matchId, sessionId, expectedVersion, deterministicStart) =>
          await Effect.runPromise(
            client.mutation(refs.public.rounds.startNextRound, {
              matchId: matchId as never,
              sessionId: sessionId as never,
              ...commandMetadata(expectedVersion),
              deterministicStart,
            }),
          ),
        takeTurn: async (matchId, sessionId, action, expectedVersion) =>
          await Effect.runPromise(
            client.mutation(refs.public.turns.takeTurn, {
              matchId: matchId as never,
              sessionId: sessionId as never,
              ...commandMetadata(expectedVersion),
              action,
            }),
          ),
        resolveAction: async (matchId, sessionId, targetPlayerId, expectedVersion) =>
          await Effect.runPromise(
            client.mutation(refs.public.turns.resolveAction, {
              matchId: matchId as never,
              sessionId: sessionId as never,
              ...commandMetadata(expectedVersion),
              targetPlayerId: targetPlayerId as never,
            }),
          ),
      };

      const result = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(MATCH_REPLAY_SCENARIO), harness),
      );

      assertEquals(result.status, "matched");
      if (result.status !== "matched") {
        throw new Error("Expected deterministic replay to match");
      }
      assertEquals(result.stepsConsumed, 2);
      assertEquals(result.finalOutcome.roundStatus, "completed");
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("replays a deterministic later round with explicit target confirmation", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const harness: ReplayHarness = {
        createStartedMatch: async (playerNames, options) => {
          const [hostName, ...guestNames] = playerNames;
          const sessions = playerNames.map((name, index) => ({
            name,
            sessionId: `session-${index + 1}`,
          }));
          const created = await Effect.runPromise(
            client.mutation(refs.public.matches.createMatch, {
              hostName,
              sessionId: sessions[0]!.sessionId as never,
            }),
          );
          for (const [index, guestName] of guestNames.entries()) {
            await Effect.runPromise(
              client.mutation(refs.public.matches.joinMatch, {
                matchId: created.matchId,
                playerName: guestName,
                sessionId: sessions[index + 1]!.sessionId as never,
              }),
            );
          }
          const started = await Effect.runPromise(
            client.mutation(refs.public.matches.startMatch, {
              matchId: created.matchId,
              sessionId: sessions[0]!.sessionId as never,
              ...commandMetadata(created.version),
              deterministicStart: options.deterministicStart,
            }),
          );
          return { matchId: created.matchId, sessions, started };
        },
        advanceUntilRoundBoundary: async (matchId, sessions) => {
          for (let guard = 0; guard < 50; guard += 1) {
            let snapshot = null;
            for (const session of sessions) {
              snapshot = await Effect.runPromise(
                client.query(refs.public.matches.getMatchSnapshot, {
                  matchId: matchId as never,
                  sessionId: session.sessionId as never,
                }),
              );
              if (snapshot) break;
            }
            if (!snapshot) throw new Error("Expected a match snapshot while resolving gameplay");
            if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
              return snapshot;
            }
            if (snapshot.pendingAction) {
              const sourceSession = sessions.find(
                (session) =>
                  snapshot.pendingAction?.sourcePlayerId ===
                  snapshot.players.find((player) => player.displayName === session.name)?.playerId,
              );
              if (!sourceSession) throw new Error("Expected a source session for pending action");
              await Effect.runPromise(
                client.mutation(refs.public.turns.resolveAction, {
                  matchId: matchId as never,
                  targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
                  sessionId: sourceSession.sessionId as never,
                  ...commandMetadata(snapshot.version),
                }),
              );
              continue;
            }
            const activeSession = sessions.find(
              (session) =>
                snapshot.activePlayerId ===
                snapshot.players.find((player) => player.displayName === session.name)?.playerId,
            );
            if (!activeSession)
              throw new Error("Expected an active session while round is in progress");
            await Effect.runPromise(
              client.mutation(refs.public.turns.takeTurn, {
                matchId: matchId as never,
                action: "stay",
                sessionId: activeSession.sessionId as never,
                ...commandMetadata(snapshot.version),
              }),
            );
          }
          throw new Error("Timed out while advancing round state");
        },
        startDeterministicNextRound: async (matchId, sessionId, expectedVersion, deterministicStart) =>
          await Effect.runPromise(
            client.mutation(refs.public.rounds.startNextRound, {
              matchId: matchId as never,
              sessionId: sessionId as never,
              ...commandMetadata(expectedVersion),
              deterministicStart,
            }),
          ),
        takeTurn: async (matchId, sessionId, action, expectedVersion) =>
          await Effect.runPromise(
            client.mutation(refs.public.turns.takeTurn, {
              matchId: matchId as never,
              sessionId: sessionId as never,
              ...commandMetadata(expectedVersion),
              action,
            }),
          ),
        resolveAction: async (matchId, sessionId, targetPlayerId, expectedVersion) =>
          await Effect.runPromise(
            client.mutation(refs.public.turns.resolveAction, {
              matchId: matchId as never,
              sessionId: sessionId as never,
              ...commandMetadata(expectedVersion),
              targetPlayerId: targetPlayerId as never,
            }),
          ),
      };

      const result = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(ROUND_REPLAY_SCENARIO), harness),
      );

      if (result.status !== "matched") {
        throw new Error(JSON.stringify(result, null, 2));
      }
      assertEquals(result.status, "matched");
      assertEquals(result.stepsConsumed, 4);
      assertEquals(result.finalOutcome.players[2]?.receivedActionCards[0], "freeze");
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
