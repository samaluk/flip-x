import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import refs from "@/confect/_generated/refs";
import {
  DIVERGED_REPLAY_SCENARIO,
  EXTRA_STEP_REPLAY_SCENARIO,
  INCOMPLETE_REPLAY_SCENARIO,
  cloneReplayScenario,
  runDeterministicReplayScenario,
  type ReplayHarness,
} from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";
import { describeConfectReplayResult } from "./helpers";

let idempotencySequence = 0;

function commandMetadata(expectedVersion: number) {
  idempotencySequence += 1;
  return {
    expectedVersion,
    idempotencyKey: `confect-divergence-${idempotencySequence}`,
  };
}

describe("Confect deterministic divergence", () => {
  it.effect("stops at the first mismatched replay step", () =>
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
        advanceUntilRoundBoundary: async () => {
          throw new Error("Not needed for this scenario");
        },
        startDeterministicNextRound: async () => {
          throw new Error("Not needed for this scenario");
        },
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
        runDeterministicReplayScenario(cloneReplayScenario(DIVERGED_REPLAY_SCENARIO), harness),
      );

      assertEquals(result.status, "diverged");
      if (result.status !== "diverged") {
        throw new Error(describeConfectReplayResult(result));
      }
      assertEquals(result.divergence.stepNumber, 2);
      assertEquals(describeConfectReplayResult(result).includes("diverged at step 2"), true);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("reports invalid replay scripts for missing or extra decisions", () =>
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
        advanceUntilRoundBoundary: async () => {
          throw new Error("Not needed for this scenario");
        },
        startDeterministicNextRound: async () => {
          throw new Error("Not needed for this scenario");
        },
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

      const incomplete = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(INCOMPLETE_REPLAY_SCENARIO), harness),
      );
      const extra = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(EXTRA_STEP_REPLAY_SCENARIO), harness),
      );

      assertEquals(incomplete.status, "invalid");
      assertEquals(extra.status, "invalid");
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
