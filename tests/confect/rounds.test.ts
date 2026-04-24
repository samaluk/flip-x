import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";
import { advanceUntilRoundBoundary, createStartedMatch } from "./helpers";

describe("Confect rounds", () => {
  it.effect("starts the next round after round completion", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const { matchId, sessions } = yield* createStartedMatch(["Host", "Guest"]);

      const completedSnapshot = yield* advanceUntilRoundBoundary(matchId, sessions);

      if (!completedSnapshot) {
        throw new Error("Expected a completed or scoring snapshot before starting next round");
      }

      const nextRound = yield* client.mutation(refs.public.rounds.startNextRound, {
        matchId: matchId as never,
        sessionId: sessions[0]!.sessionId,
        expectedVersion: completedSnapshot.version,
        idempotencyKey: "rounds-start-next-round",
      });

      assertEquals(nextRound.currentRoundNumber, 2);
      assertEquals(nextRound.status, "in_progress");
      assertEquals(nextRound.players.length, 2);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
