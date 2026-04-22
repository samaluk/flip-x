import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import {
  BASIC_DETERMINISTIC_SETUP_SCENARIO,
  cloneSetupScenario,
  expectSnapshotsToMatch,
} from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";
import {
  advanceUntilRoundBoundary,
  createStartedMatchWithOptions,
  startDeterministicNextRound,
} from "./helpers";

describe("Confect deterministic setup", () => {
  it.effect("startMatch uses the provided deterministic opening draw pile", () =>
    Effect.gen(function* () {
      const scenarioA = cloneSetupScenario(BASIC_DETERMINISTIC_SETUP_SCENARIO);
      const scenarioB = cloneSetupScenario(BASIC_DETERMINISTIC_SETUP_SCENARIO);

      const first = yield* createStartedMatchWithOptions([...scenarioA.playerNames], {
        deterministicStart: scenarioA.startMatch,
      });
      const second = yield* createStartedMatchWithOptions([...scenarioB.playerNames], {
        deterministicStart: scenarioB.startMatch,
      });

      expectSnapshotsToMatch(first.started, second.started);

      assertEquals(first.started.players[0]?.displayName, "Host");
      assertEquals(first.started.players[0]?.numberCards[0]?.numberValue, 1);
      assertEquals(first.started.players[1]?.numberCards[0]?.numberValue, 7);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("startNextRound uses the provided deterministic draw pile", () =>
    Effect.gen(function* () {
      const scenario = cloneSetupScenario(BASIC_DETERMINISTIC_SETUP_SCENARIO);
      const { matchId, sessions } = yield* createStartedMatchWithOptions([...scenario.playerNames], {
        deterministicStart: scenario.startMatch,
      });

      yield* advanceUntilRoundBoundary(matchId, sessions);

      const nextRound = yield* startDeterministicNextRound(
        matchId,
        sessions[0]!.sessionId,
        scenario.startNextRound,
      );

      assertEquals(nextRound.currentRoundNumber, 2);
      assertEquals(nextRound.players[1]?.modifierCards[0]?.modifierValue, 4);
      assertEquals(nextRound.players[0]?.heldActionCards.length, 0);
      assertEquals(nextRound.activePlayerId, nextRound.players[1]?.playerId);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
