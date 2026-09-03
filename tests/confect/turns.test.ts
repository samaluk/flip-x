import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Cause, Effect, Exit } from "effect";

import type { Card } from "@/game/logic/card-types";
import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatch,
  createStartedMatchWithOptions,
  getSnapshotForAnySession,
  requireActiveSessionForSnapshot,
} from "./helpers";

const nonActionDrawPile: Card[] = Array.from({ length: 50 }, (_, i) => ({
  id: `num-${i}`,
  type: "number" as const,
  label: String((i % 7) + 1),
  numberValue: ((i % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
}));

describe("Confect turns", () => {
  it.effect("takeTurn updates the round state for the active player", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const { matchId, sessions } = yield* createStartedMatchWithOptions(["Host", "Guest"], {
        deterministicStart: { roundSeed: { drawPile: nonActionDrawPile } },
      });

      const snapshot = yield* getSnapshotForAnySession(matchId, sessions);

      if (!snapshot) {
        throw new Error("Expected snapshot before taking a turn");
      }

      const activeSession = requireActiveSessionForSnapshot(
        snapshot,
        sessions,
        "Expected an active session for takeTurn",
      );

      const updated = yield* client.mutation(refs.public.turns.takeTurn, {
        matchId: matchId as never,
        action: "hit",
        sessionId: activeSession.sessionId,
        expectedVersion: snapshot.version,
        idempotencyKey: "turns-take-turn",
      });

      assertEquals(updated.currentRoundNumber, 1);
      if (!updated.latestEvent) {
        throw new Error("Expected latest event after takeTurn");
      }
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("rejects non-active player taking turn", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const { matchId, sessions, started } = yield* createStartedMatch(["Host", "Guest"]);
      const activeSession = requireActiveSessionForSnapshot(
        started,
        sessions,
        "Expected the active session for the rejection test",
      );
      const inactiveSession = sessions.find((session) => session.name !== activeSession.name);

      if (!inactiveSession) {
        throw new Error("Expected an inactive session");
      }

      const exit = yield* client
        .mutation(refs.public.turns.takeTurn, {
          matchId,
          action: "hit",
          sessionId: inactiveSession.sessionId,
          expectedVersion: started.version,
          idempotencyKey: "turns-inactive-turn",
        })
        .pipe(Effect.exit);

      if (Exit.isSuccess(exit)) {
        throw new Error("Expected inactive player turn to fail");
      }

      assertEquals(Cause.pretty(exit.cause).includes("InvalidTurn"), true);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
