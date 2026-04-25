import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect } from "effect";

import type { DeterministicStartOptions } from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatchWithOptions,
  getSnapshotForAnySession,
  readRoundState,
  runCommand,
} from "./helpers";

describe("Confect command runner turns", () => {
  it.effect("TAKE_TURN persists the updated round state and appended event", () =>
    Effect.gen(function* () {
      const deterministicStart: DeterministicStartOptions = {
        roundSeed: {
          drawPile: [
            { id: "runner-open-1", type: "number", label: "1", numberValue: 1 },
            { id: "runner-open-2", type: "number", label: "7", numberValue: 7 },
            { id: "runner-hit-1", type: "number", label: "4", numberValue: 4 },
          ],
        },
      };
      const { matchId, sessions } = yield* createStartedMatchWithOptions(["Host", "Guest"], {
        deterministicStart,
      });
      const snapshot = yield* getSnapshotForAnySession(matchId, sessions);

      if (!snapshot) {
        throw new Error("Expected snapshot before TAKE_TURN");
      }

      const activeSession = sessions.find(
        (session) =>
          snapshot.activePlayerId ===
          snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!activeSession) {
        throw new Error("Expected an active session before TAKE_TURN");
      }

      const updated = yield* runCommand(matchId, activeSession.sessionId, {
        type: "TAKE_TURN",
        expectedVersion: snapshot.version,
        idempotencyKey: "runner-take-turn",
        action: "hit",
      });
      const roundState = yield* readRoundState(matchId);

      assertEquals(updated.currentRoundNumber, 1);
      assertTrue(roundState.eventTypes.length > 0);
      assertEquals(updated.latestEvent?.type, roundState.eventTypes.at(-1) ?? null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("RESOLVE_ACTION updates pending-action state through the runner", () =>
    Effect.gen(function* () {
      const deterministicStart: DeterministicStartOptions = {
        roundSeed: {
          drawPile: [
            { id: "resolve-open-1", type: "number", label: "1", numberValue: 1 },
            { id: "resolve-open-2", type: "number", label: "2", numberValue: 2 },
            { id: "resolve-open-3", type: "number", label: "3", numberValue: 3 },
            { id: "resolve-freeze-1", type: "action", label: "freeze", actionKind: "freeze" },
          ],
        },
      };
      const { matchId, sessions } = yield* createStartedMatchWithOptions(
        ["Host", "Guest", "Third"],
        { deterministicStart },
      );

      const startingSnapshot = yield* getSnapshotForAnySession(matchId, sessions);
      if (!startingSnapshot) {
        throw new Error("Expected a snapshot before TAKE_TURN");
      }

      const activeSession = sessions.find(
        (session) =>
          startingSnapshot.activePlayerId ===
          startingSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );
      if (!activeSession) {
        throw new Error("Expected an active session before TAKE_TURN");
      }

      const snapshot = yield* runCommand(matchId, activeSession.sessionId, {
        type: "TAKE_TURN",
        expectedVersion: startingSnapshot.version,
        idempotencyKey: "runner-pending-action",
        action: "hit",
      });
      if (!snapshot.pendingAction) {
        throw new Error("Expected a pending action before RESOLVE_ACTION");
      }

      const sourceSession = sessions.find(
        (session) =>
          snapshot.pendingAction?.sourcePlayerId ===
          snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );
      if (!sourceSession) {
        throw new Error("Expected a source session for RESOLVE_ACTION");
      }

      const updated = yield* runCommand(matchId, sourceSession.sessionId, {
        type: "RESOLVE_ACTION",
        expectedVersion: snapshot.version,
        idempotencyKey: "runner-resolve-action",
        targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
      });

      assertEquals(updated.pendingAction, null);
      assertTrue(updated.latestEvent !== null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
