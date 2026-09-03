import { describe, expect, it } from "vitest";

import {
  DIVERGED_REPLAY_SCENARIO,
  INCOMPLETE_REPLAY_SCENARIO,
  MATCH_REPLAY_SCENARIO,
  cloneReplayScenario,
  createStubReplayHarness,
  describeReplayResult,
  runDeterministicReplayScenario,
} from "@/tests/fixtures/deterministic";

describe("deterministic replay runner", () => {
  it("reports the first mismatched step", async () => {
    const scenario = cloneReplayScenario(DIVERGED_REPLAY_SCENARIO);
    const harness = createStubReplayHarness(MATCH_REPLAY_SCENARIO.expectedStates);

    const result = await runDeterministicReplayScenario(scenario, harness);

    expect(result.status).toBe("diverged");
    if (result.status !== "diverged") {
      return;
    }

    expect(result.divergence.stepNumber).toBe(2);
    expect(describeReplayResult(result)).toContain("diverged at step 2");
  });

  it("reports an invalid result when the script ends before the round boundary", async () => {
    const scenario = cloneReplayScenario(INCOMPLETE_REPLAY_SCENARIO);
    const harness = createStubReplayHarness(MATCH_REPLAY_SCENARIO.expectedStates);

    const result = await runDeterministicReplayScenario(scenario, harness);

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") {
      return;
    }

    expect(result.validationError).toContain("ended before gameplay reached a round boundary");
  });
});
