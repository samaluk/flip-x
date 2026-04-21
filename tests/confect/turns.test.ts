import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";
import { createStartedMatch, getSnapshotForAnySession, type SessionRecord } from "./helpers";

describe("Confect turns", () => {
  it.effect("takeTurn updates the round state for the active player", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const { matchId, sessions } = yield* createStartedMatch(["Host", "Guest"]);

      const snapshot = yield* getSnapshotForAnySession(matchId, sessions);

      if (!snapshot) {
        throw new Error("Expected snapshot before taking a turn");
      }

      const activeSession = sessions.find(
        (session) =>
          snapshot.activePlayerId ===
          snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!activeSession) {
        throw new Error("Expected an active session for takeTurn");
      }

      const updated = yield* client.mutation(refs.public.turns.takeTurn, {
        matchId: matchId as never,
        action: "hit",
        sessionId: activeSession.sessionId,
      });

      assertEquals(updated.currentRoundNumber, 1);
      if (!updated.latestEvent) {
        throw new Error("Expected latest event after takeTurn");
      }
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("resolveAction updates round state when a pending action exists", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      let currentMatchId = "";
      let currentSessions: SessionRecord[] = [];

      let snapshot = null;
      for (let attempt = 0; attempt < 5 && !snapshot?.pendingAction; attempt += 1) {
        const started = yield* createStartedMatch(["Host", "Guest", "Third"]);
        currentMatchId = started.matchId;
        currentSessions = started.sessions;
        snapshot = started.started;

        for (let guard = 0; guard < 50; guard += 1) {
          snapshot = yield* getSnapshotForAnySession(currentMatchId, currentSessions);

          if (!snapshot) {
            throw new Error("Expected snapshot while waiting for a pending action");
          }

          if (snapshot.pendingAction) {
            break;
          }

          if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
            break;
          }

          const activeSession = currentSessions.find(
            (session) =>
              snapshot?.activePlayerId ===
              snapshot?.players.find((player) => player.displayName === session.name)?.playerId,
          );

          if (!activeSession) {
            break;
          }

          snapshot = yield* client.mutation(refs.public.turns.takeTurn, {
            matchId: currentMatchId as never,
            action: "hit",
            sessionId: activeSession.sessionId,
          });
        }
      }

      if (!snapshot?.pendingAction) {
        throw new Error("Expected pending action before resolveAction");
      }

      const sourceSession = currentSessions.find(
        (session) =>
          snapshot?.pendingAction?.sourcePlayerId ===
          snapshot?.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!sourceSession) {
        throw new Error("Expected source session for resolveAction");
      }

      const updated = yield* client.mutation(refs.public.turns.resolveAction, {
        matchId: currentMatchId as never,
        targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
        sessionId: sourceSession.sessionId,
      });

      if (!updated.latestEvent) {
        throw new Error("Expected latest event after resolveAction");
      }
      if (updated.pendingAction === snapshot.pendingAction) {
        throw new Error("Expected resolveAction to change pending action state");
      }
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
