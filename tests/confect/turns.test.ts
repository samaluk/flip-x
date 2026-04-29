import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import type { Card } from "@/game/logic/card-types";
import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";
import { createStartedMatchWithOptions, getSnapshotForAnySession, requireActiveSessionForSnapshot } from "./helpers";

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
});
