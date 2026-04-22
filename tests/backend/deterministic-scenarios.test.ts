import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  BASIC_DETERMINISTIC_SETUP_SCENARIO,
  cloneSetupScenario,
  expectSnapshotsToMatch,
} from "@/tests/fixtures/deterministic";

import {
  createStartedMatch,
  createTestClient,
  resetTestClient,
  startDeterministicNextRound,
} from "./convex-test-helper";

describe("Convex deterministic setup", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("startMatch uses the provided deterministic opening draw pile", async () => {
    const scenarioA = cloneSetupScenario(BASIC_DETERMINISTIC_SETUP_SCENARIO);
    const scenarioB = cloneSetupScenario(BASIC_DETERMINISTIC_SETUP_SCENARIO);

    const first = await createStartedMatch(client, scenarioA.playerNames, {
      deterministicStart: scenarioA.startMatch,
    });

    await resetTestClient(client);
    client = createTestClient();

    const second = await createStartedMatch(client, scenarioB.playerNames, {
      deterministicStart: scenarioB.startMatch,
    });

    expectSnapshotsToMatch(first.started, second.started);
    expect(first.started.players[0]?.numberCards[0]?.numberValue).toBe(1);
    expect(first.started.players[1]?.numberCards[0]?.numberValue).toBe(7);
  });

  it("startNextRound uses the provided deterministic draw pile", async () => {
    const scenario = cloneSetupScenario(BASIC_DETERMINISTIC_SETUP_SCENARIO);
    const { matchId, sessions } = await createStartedMatch(client, scenario.playerNames, {
      deterministicStart: scenario.startMatch,
    });

    const firstPlayer = sessions[0]!;
    const secondPlayer = sessions[1]!;

    await client.mutation(api.turns.takeTurn, {
      matchId,
      action: "stay",
      sessionId: firstPlayer.sessionId,
    });
    await client.mutation(api.turns.takeTurn, {
      matchId,
      action: "stay",
      sessionId: secondPlayer.sessionId,
    });

    const nextRound = await startDeterministicNextRound(
      client,
      matchId as Id<"matches">,
      firstPlayer.sessionId,
      scenario.startNextRound,
    );

    expect(nextRound.currentRoundNumber).toBe(2);
    expect(nextRound.players[1]?.modifierCards[0]?.modifierValue).toBe(4);
    expect(nextRound.players[0]?.heldActionCards).toHaveLength(0);
    expect(nextRound.activePlayerId).toBe(nextRound.players[1]?.playerId);
  });
});
