import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect } from "effect";

import {
  BASIC_DETERMINISTIC_SETUP_SCENARIO,
  cloneSetupScenario,
  expectSnapshotsToMatch,
} from "@/tests/fixtures/deterministic";
import type { DeterministicStartOptions } from "@/tests/fixtures/deterministic";

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
      const { matchId, sessions } = yield* createStartedMatchWithOptions(
        [...scenario.playerNames],
        {
          deterministicStart: scenario.startMatch,
        },
      );

      yield* advanceUntilRoundBoundary(matchId, sessions);

      const nextRound = yield* startDeterministicNextRound(
        matchId,
        sessions[0]!.sessionId,
        scenario.startNextRound,
      );

      const host = nextRound.players[0]!;

      assertEquals(nextRound.currentRoundNumber, 2);
      assertEquals(nextRound.roundStatus, "resolving_action");
      assertEquals(nextRound.players[1]?.modifierCards[0]?.modifierValue, 4);
      assertEquals(host.heldActionCards.length, 1);
      assertEquals(host.heldActionCards[0]?.actionKind, "freeze");
      assertEquals(host.heldActionCards[0]?.label, "freeze");
      assertEquals(nextRound.pendingAction?.sourcePlayerId, host.playerId);
      assertEquals(nextRound.pendingAction?.actionKind, "freeze");
      assertEquals(nextRound.pendingAction?.resume, "dealing");
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("startNextRound deals every player after dealer rotation in a three-player match", () =>
    Effect.gen(function* () {
      const nextRoundStart: DeterministicStartOptions = {
        roundSeed: {
          drawPile: [
            { id: "r2-seat-1", type: "number", label: "1", numberValue: 1 },
            { id: "r2-seat-2", type: "number", label: "2", numberValue: 2 },
            { id: "r2-seat-0", type: "number", label: "3", numberValue: 3 },
            { id: "r2-fill-1", type: "number", label: "11", numberValue: 11 },
          ],
        },
      };

      const { matchId, sessions } = yield* createStartedMatchWithOptions(["Host", "Guest", "Third"], {});

      yield* advanceUntilRoundBoundary(matchId, sessions);

      const nextRound = yield* startDeterministicNextRound(
        matchId,
        sessions[0]!.sessionId,
        nextRoundStart,
      );

      const byName = new Map(nextRound.players.map((player) => [player.displayName, player]));
      const host = byName.get("Host");
      const guest = byName.get("Guest");
      const third = byName.get("Third");

      assertEquals(nextRound.currentRoundNumber, 2);
      assertEquals(nextRound.dealerSeat, 1);
      assertEquals(nextRound.roundStatus, "player_turns");
      assertTrue(host !== undefined);
      assertTrue(guest !== undefined);
      assertTrue(third !== undefined);
      assertEquals(host.numberCards.length, 1);
      assertEquals(host.numberCards[0]?.numberValue, 3);
      assertEquals(guest.numberCards.length, 1);
      assertEquals(guest.numberCards[0]?.numberValue, 1);
      assertEquals(third.numberCards.length, 1);
      assertEquals(third.numberCards[0]?.numberValue, 2);
      assertEquals(nextRound.activePlayerId, guest.playerId);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
