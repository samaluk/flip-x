import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect } from "effect";
import { expect } from "vitest";

import refs from "@/confect/_generated/refs";
import { cloneSetupScenario } from "@/tests/fixtures/deterministic/setup-scenarios";

import * as TestConfect from "./TestConfect";
import { runCommand, type SessionRecord } from "./helpers";

describe("Confect command runner start", () => {
  it.effect("START_MATCH with deterministic draw pile matches the existing opening snapshot", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const scenario = cloneSetupScenario();
      const sessions = scenario.playerNames.map((name, index) => ({
        name,
        sessionId: `runner-start-${index}` as SessionRecord["sessionId"],
      }));

      const directCreated = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: scenario.playerNames[0],
        sessionId: sessions[0]!.sessionId,
      });

      for (const [index, guestName] of scenario.playerNames.slice(1).entries()) {
        yield* client.mutation(refs.public.matches.joinMatch, {
          matchId: directCreated.matchId,
          playerName: guestName,
          sessionId: sessions[index + 1]!.sessionId,
        });
      }

      const directSnapshot = yield* runCommand(directCreated.matchId, sessions[0]!.sessionId, {
        type: "START_MATCH",
        expectedVersion: directCreated.version,
        idempotencyKey: "runner-start-match",
        deterministicStart: scenario.startMatch,
      });
      const openingValues = directSnapshot.players
        .flatMap((player) => player.numberCards.map((card) => card.numberValue))
        .toSorted((left, right) => left - right);

      assertEquals(directSnapshot.status, "in_progress");
      assertEquals(directSnapshot.currentRoundNumber, 1);
      assertTrue(directSnapshot.latestEvent !== null);
      expect(openingValues.slice(0, 2)).toEqual([1, 7]);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
