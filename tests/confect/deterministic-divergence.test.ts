import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Effect } from "effect";

import {
  DIVERGED_REPLAY_SCENARIO,
  EXTRA_STEP_REPLAY_SCENARIO,
  INCOMPLETE_REPLAY_SCENARIO,
  cloneReplayScenario,
  createDivergenceReplayHarness,
  runDeterministicReplayScenario,
} from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";
import { describeConfectReplayResult } from "./helpers";

let idempotencySequence = 0;

function commandMetadata(expectedVersion: number) {
  idempotencySequence += 1;
  return {
    expectedVersion,
    idempotencyKey: `confect-divergence-${idempotencySequence}`,
  };
}

describe("Confect deterministic divergence", () => {
  it.effect("stops at the first mismatched replay step", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const harness = createDivergenceReplayHarness(client, commandMetadata);

      const result = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(DIVERGED_REPLAY_SCENARIO), harness),
      );

      assertEquals(result.status, "diverged");
      if (result.status !== "diverged") {
        throw new Error(describeConfectReplayResult(result));
      }
      assertEquals(result.divergence.stepNumber, 2);
      assertEquals(describeConfectReplayResult(result).includes("diverged at step 2"), true);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("reports invalid replay scripts for missing or extra decisions", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const harness = createDivergenceReplayHarness(client, commandMetadata);

      const incomplete = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(INCOMPLETE_REPLAY_SCENARIO), harness),
      );
      const extra = yield* Effect.promise(() =>
        runDeterministicReplayScenario(cloneReplayScenario(EXTRA_STEP_REPLAY_SCENARIO), harness),
      );

      assertEquals(incomplete.status, "invalid");
      assertEquals(extra.status, "invalid");
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
