import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect, Schema } from "effect";

import { MutationCtx } from "@/confect/_generated/services";
import { runGameCommand } from "@/game/application/run-command";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatch,
  driveMatchUntilCompleted,
  getSnapshotForAnySession,
  readRoundState,
} from "./helpers";

describe("Confect command runner finalization", () => {
  it.effect("rewrites score breakdowns, carries totals, and marks the winner", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const { matchId, sessions } = yield* createStartedMatch(["Host", "Guest"]);

      yield* client.run(
        Effect.gen(function* () {
          const ctx = (yield* MutationCtx) as unknown as Parameters<typeof runGameCommand>[0];
          yield* Effect.promise(() => ctx.db.patch(matchId as never, { targetScore: 0 }));
        }),
        Schema.Void,
      );

      const snapshot = yield* getSnapshotForAnySession(matchId, sessions);
      if (!snapshot) {
        throw new Error("Expected snapshot before finalization");
      }

      const finalSnapshot = yield* driveMatchUntilCompleted(matchId, sessions, snapshot);

      const roundState = yield* readRoundState(matchId);
      const winningPlayers = roundState.players.filter((player) => player.hasWon);

      assertEquals(finalSnapshot.status, "completed");
      assertEquals(roundState.matchStatus, "completed");
      assertEquals(roundState.scoreBreakdownCount, roundState.players.length);
      assertTrue(roundState.players.every((player) => player.totalScore >= 0));
      assertEquals(winningPlayers.length, 1);
      assertEquals(roundState.winnerPlayerId, winningPlayers[0]?.playerId ?? null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
