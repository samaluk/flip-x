import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  BASIC_DETERMINISTIC_SETUP_SCENARIO,
  cloneSetupScenario,
  expectSnapshotsToMatch,
} from "@/tests/fixtures/deterministic";
import type { DeterministicStartOptions } from "@/tests/fixtures/deterministic";

import {
  advanceUntilRoundBoundary,
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
    expect(nextRound.roundStatus).toBe("resolving_action");
    expect(nextRound.players[1]?.modifierCards[0]?.modifierValue).toBe(4);
    expect(nextRound.players[0]?.heldActionCards).toEqual([
      { label: "freeze", actionKind: "freeze" },
    ]);
    expect(nextRound.pendingAction).toMatchObject({
      sourcePlayerId: nextRound.players[0]?.playerId,
      actionKind: "freeze",
      resume: "dealing",
    });
  });

  it("startNextRound deals every player after dealer rotation in a three-player match", async () => {
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

    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest", "Third"]);

    await advanceUntilRoundBoundary(client, matchId, sessions);

    const nextRound = await startDeterministicNextRound(
      client,
      matchId as Id<"matches">,
      sessions[0]!.sessionId,
      nextRoundStart,
    );

    const byName = new Map(nextRound.players.map((player) => [player.displayName, player]));

    expect(nextRound.currentRoundNumber).toBe(2);
    expect(nextRound.dealerSeat).toBe(1);
    expect(nextRound.roundStatus).toBe("player_turns");
    expect(byName.get("Host")?.numberCards.map((card) => card.numberValue)).toEqual([3]);
    expect(byName.get("Guest")?.numberCards.map((card) => card.numberValue)).toEqual([1]);
    expect(byName.get("Third")?.numberCards.map((card) => card.numberValue)).toEqual([2]);
    expect(nextRound.activePlayerId).toBe(byName.get("Guest")?.playerId);
  });
});
