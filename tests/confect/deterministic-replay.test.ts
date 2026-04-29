import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import {
  MATCH_REPLAY_SCENARIO,
  ROUND_REPLAY_SCENARIO,
  cloneReplayScenario,
  createDeterministicReplayHarness,
  runDeterministicReplayScenario,
} from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";

let idempotencySequence = 0;

function commandMetadata(expectedVersion: number) {
  idempotencySequence += 1;
  return {
    expectedVersion,
    idempotencyKey: `confect-replay-${idempotencySequence}`,
  };
}

describe("Confect deterministic replay", () => {
  it.effect("replays a deterministic full match step-by-step", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const harness = createDeterministicReplayHarness(client, commandMetadata);

      const result = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(MATCH_REPLAY_SCENARIO), harness),
      );

      assertEquals(result.status, "matched");
      if (result.status !== "matched") {
        throw new Error("Expected deterministic replay to match");
      }
      assertEquals(result.stepsConsumed, 2);
      assertEquals(result.finalOutcome.roundStatus, "completed");
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("replays a deterministic later round with explicit target confirmation", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const harness = createDeterministicReplayHarness(client, commandMetadata);

      const result = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(ROUND_REPLAY_SCENARIO), harness),
      );

      if (result.status !== "matched") {
        throw new Error(JSON.stringify(result, null, 2));
      }
      assertEquals(result.status, "matched");
      assertEquals(result.stepsConsumed, 4);
      assertEquals(result.finalOutcome.players[2]?.receivedActionCards[0], "freeze");
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
