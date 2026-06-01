import { describe, it } from "@effect/vitest";
import { assertTrue } from "@effect/vitest/utils";
import { Effect } from "effect";
import { expect } from "vitest";

import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatchWithOptions,
  getSnapshotForAnySession,
  readRoundState,
  requireActiveSessionForSnapshot,
  runCommand,
  type SessionRecord,
} from "./helpers";

function expectContiguousEventSequences(sequences: readonly number[]) {
  assertTrue(sequences.length > 1);
  expect(sequences).toEqual(sequences.map((_, index) => index + 1));
  expect(new Set(sequences).size).toBe(sequences.length);
}

describe("saveCommandResult event persistence", () => {
  it.effect("assigns monotonic round event sequences when a command appends multiple events", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const sessions: SessionRecord[] = [
        { name: "Host", sessionId: "event-seq-host" as SessionRecord["sessionId"] },
        { name: "Guest", sessionId: "event-seq-guest" as SessionRecord["sessionId"] },
      ];

      const created = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: sessions[0]!.name,
        sessionId: sessions[0]!.sessionId,
      });

      yield* client.mutation(refs.public.matches.joinMatch, {
        matchId: created.matchId,
        playerName: sessions[1]!.name,
        sessionId: sessions[1]!.sessionId,
      });

      yield* runCommand(created.matchId, sessions[0]!.sessionId, {
        type: "START_MATCH",
        expectedVersion: created.version,
        idempotencyKey: "event-seq-start",
        deterministicStart: {
          roundSeed: {
            drawPile: [
              { id: "open-1", type: "number", label: "1", numberValue: 1 },
              { id: "open-2", type: "number", label: "2", numberValue: 2 },
              { id: "open-3", type: "number", label: "3", numberValue: 3 },
              { id: "open-4", type: "number", label: "4", numberValue: 4 },
            ],
          },
        },
      });

      const roundState = yield* readRoundState(created.matchId);
      expectContiguousEventSequences(roundState.eventSequences);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("continues event sequences across later commands in the same round", () =>
    Effect.gen(function* () {
      const { matchId, sessions } = yield* createStartedMatchWithOptions(["Host", "Guest"], {
        deterministicStart: {
          roundSeed: {
            drawPile: [
              { id: "seq-open-1", type: "number", label: "1", numberValue: 1 },
              { id: "seq-open-2", type: "number", label: "7", numberValue: 7 },
              { id: "seq-hit-1", type: "number", label: "4", numberValue: 4 },
            ],
          },
        },
      });

      const afterStart = yield* readRoundState(matchId);
      const startCount = afterStart.eventSequences.length;

      const beforeHit = yield* getSnapshotForAnySession(matchId, sessions);
      if (!beforeHit) {
        throw new Error("Expected snapshot before TAKE_TURN");
      }

      const activeSession = requireActiveSessionForSnapshot(
        beforeHit,
        sessions,
        "Expected active session before TAKE_TURN",
      );

      const snapshot = yield* runCommand(matchId, activeSession.sessionId, {
        type: "TAKE_TURN",
        expectedVersion: beforeHit.version,
        idempotencyKey: "event-seq-hit",
        action: "hit",
      });

      assertTrue(snapshot.latestEvent !== null);

      const afterHit = yield* readRoundState(matchId);
      assertTrue(afterHit.eventSequences.length > startCount);
      expect(afterHit.eventSequences).toEqual(afterHit.eventSequences.map((_, index) => index + 1));
      expect(new Set(afterHit.eventSequences).size).toBe(afterHit.eventSequences.length);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
