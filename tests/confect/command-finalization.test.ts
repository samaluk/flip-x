import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect, Schema } from "effect";

import { MutationCtx } from "@/confect/_generated/services";
import { runGameCommand } from "@/game/application/run-command";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatch,
  getSnapshotForAnySession,
  readRoundState,
  runCommand,
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

      let finalSnapshot = snapshot;

      for (let guard = 0; guard < 50 && finalSnapshot.roundStatus !== "completed"; guard += 1) {
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
