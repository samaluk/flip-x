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

});
