import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";
import {
  MATCH_REPLAY_SCENARIO,
  ROUND_REPLAY_SCENARIO,
  cloneReplayScenario,
  runDeterministicReplayScenario,
  type ReplayHarness,
} from "@/tests/fixtures/deterministic";

import {
  advanceUntilRoundBoundary,
  createStartedMatch,
  createTestClient,
  resetTestClient,
  startDeterministicNextRound,
} from "./convex-test-helper";

describe("Convex deterministic replay", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  function backendHarness(): ReplayHarness {
    return {
      createStartedMatch: async (playerNames, options) =>
        await createStartedMatch(client, playerNames as never, options),
      advanceUntilRoundBoundary: async (matchId, sessions) =>
        await advanceUntilRoundBoundary(client, matchId as never, sessions as never),
      startDeterministicNextRound: async (matchId, sessionId, deterministicStart) =>
        await startDeterministicNextRound(client, matchId as never, sessionId as never, deterministicStart),
      takeTurn: async (matchId, sessionId, action) =>
        await client.mutation(api.turns.takeTurn, {
          matchId: matchId as never,
          sessionId: sessionId as never,
          action,
        }),
      resolveAction: async (matchId, sessionId, targetPlayerId) =>
        await client.mutation(api.turns.resolveAction, {
          matchId: matchId as never,
          sessionId: sessionId as never,
          targetPlayerId: targetPlayerId as never,
        }),
    };
  }

  it("replays a deterministic full match step-by-step", async () => {
    const result = await runDeterministicReplayScenario(
      cloneReplayScenario(MATCH_REPLAY_SCENARIO),
      backendHarness(),
    );

    expect(result.status).toBe("matched");
    if (result.status !== "matched") {
      return;
    }

    expect(result.stepsConsumed).toBe(2);
    expect(result.finalOutcome.roundStatus).toBe("completed");
  });

  it("replays a deterministic later round with explicit target confirmation", async () => {
    const result = await runDeterministicReplayScenario(
      cloneReplayScenario(ROUND_REPLAY_SCENARIO),
      backendHarness(),
    );

    expect(result.status).toBe("matched");
    if (result.status !== "matched") {
      return;
    }

    expect(result.stepsConsumed).toBe(3);
    expect(result.finalOutcome.players[2]?.receivedActionCards[0]).toBe("freeze");
  });

  it("reruns deterministically 10 times with identical outcomes", async () => {
    const results: Array<{ stepsConsumed: number; finalRound: string; winnerId: string | null }> = [];
    for (let run = 0; run < 10; run += 1) {
      const result = await runDeterministicReplayScenario(
        cloneReplayScenario(MATCH_REPLAY_SCENARIO),
        backendHarness(),
      );
      if (result.status !== "matched") {
        throw new Error(`Run ${run + 1} failed: ${JSON.stringify(result, null, 2)}`);
      }
      results.push({
        stepsConsumed: result.stepsConsumed,
        finalRound: result.finalOutcome.roundStatus,
        winnerId: result.finalOutcome.winnerId,
      });
    }

    for (let run = 1; run < 10; run += 1) {
      expect(results[run]!.stepsConsumed).toBe(results[0]!.stepsConsumed);
      expect(results[run]!.finalRound).toBe(results[0]!.finalRound);
      expect(results[run]!.winnerId).toBe(results[0]!.winnerId);
    }
  });
});
