import { describe, expect, it } from "vitest";

import { continueRound } from "@/game/logic/command-handler";
import { resolvePendingAction } from "@/game/logic/command-handler";
import { actionCard, numberCard } from "@/tests/builders/cards";
import {
  createPlayerRoundStates,
  createRoundRuntime,
  testPlayers2P,
  testPlayers3P,
  testPlayers4P,
} from "@/tests/builders/round-runtime";

describe("opening deal", () => {
  it("deals the opening round and advances to player turns", () => {
    const playerStates = createPlayerRoundStates();
    const round = createRoundRuntime();

    round.drawPile = [numberCard("c1", 1), numberCard("c2", 2), numberCard("c3", 3)];

    const resolved = continueRound(testPlayers3P, round, playerStates);

    expect(resolved.round.phase).toBe("player_turns");
    expect(resolved.playerStates.p1.numberCards[0]?.numberValue).toBe(1);
    expect(resolved.playerStates.p2.numberCards[0]?.numberValue).toBe(2);
    expect(resolved.playerStates.p3.numberCards[0]?.numberValue).toBe(3);
  });

  it("deals every player when round 2 starts with dealer seat 1 in a three-player game", () => {
    const playerStates = createPlayerRoundStates();
    const round = createRoundRuntime(testPlayers3P, 2, 1);

    round.drawPile = [numberCard("c1", 1), numberCard("c2", 2), numberCard("c3", 3)];

    const resolved = continueRound(testPlayers3P, round, playerStates);

    expect(resolved.round.phase).toBe("player_turns");
    expect(resolved.playerStates.p2.numberCards[0]?.numberValue).toBe(1);
    expect(resolved.playerStates.p3.numberCards[0]?.numberValue).toBe(2);
    expect(resolved.playerStates.p1.numberCards[0]?.numberValue).toBe(3);
  });

  it("deals both players when round 2 starts with dealer seat 1 in a two-player game", () => {
    const playerStates = createPlayerRoundStates(testPlayers2P);
    const round = createRoundRuntime(testPlayers2P, 2, 1);

    round.drawPile = [numberCard("c1", 4), numberCard("c2", 9)];

    const resolved = continueRound(testPlayers2P, round, playerStates);

    expect(resolved.round.phase).toBe("player_turns");
    expect(resolved.playerStates.p2.numberCards[0]?.numberValue).toBe(4);
    expect(resolved.playerStates.p1.numberCards[0]?.numberValue).toBe(9);
  });

  it("resumes opening deal from the next undealt seat after a pending action resolves", () => {
    const playerStates = createPlayerRoundStates(testPlayers4P);
    const round = createRoundRuntime(testPlayers4P, 1, 0);

    round.drawPile = [
      numberCard("c1", 1),
      numberCard("c2", 2),
      actionCard("freeze-opening", "freeze"),
      numberCard("c4", 4),
    ];

    const paused = continueRound(testPlayers4P, round, playerStates);

    expect(paused.round.phase).toBe("resolving_action");
    expect(paused.round.pendingAction).toMatchObject({
      sourcePlayerId: "p3",
      actionKind: "freeze",
      resume: "dealing",
    });

    const resumed = resolvePendingAction(testPlayers4P, paused.round, paused.playerStates, "p1");

    expect(resumed.round.phase).toBe("player_turns");
    expect(resumed.playerStates.p4.numberCards[0]?.numberValue).toBe(4);
    expect(resumed.playerStates.p1.receivedActionCards).toEqual([
      actionCard("freeze-opening", "freeze"),
    ]);
  });

  it("creates pending action when first player gets freeze as their first card", () => {
    const playerStates = createPlayerRoundStates();
    const round = createRoundRuntime();

    round.drawPile = [
      actionCard("freeze-first", "freeze"),
      numberCard("c2", 2),
      numberCard("c3", 3),
    ];

    const resolved = continueRound(testPlayers3P, round, playerStates);

    expect(resolved.round.phase).toBe("resolving_action");
    expect(resolved.round.pendingAction).toMatchObject({
      sourcePlayerId: "p1",
      actionKind: "freeze",
      resume: "dealing",
    });
    expect(resolved.playerStates.p1.status).toBe("active");
    expect(resolved.playerStates.p1.receivedActionCards).toHaveLength(0);
  });

  it("creates pending action when first player gets Flip Three as their first card", () => {
    const playerStates = createPlayerRoundStates();
    const round = createRoundRuntime();

    round.drawPile = [
      actionCard("flip3-first", "flip_three"),
      numberCard("c2", 2),
      numberCard("c3", 3),
    ];

    const resolved = continueRound(testPlayers3P, round, playerStates);

    expect(resolved.round.phase).toBe("resolving_action");
    expect(resolved.round.pendingAction).toMatchObject({
      sourcePlayerId: "p1",
      actionKind: "flip_three",
      resume: "dealing",
    });
    expect(resolved.round.pendingAction?.eligibleTargetIds).toEqual(["p1", "p2", "p3"]);
    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.playerStates.p1.heldActionCards).toEqual([
      actionCard("flip3-first", "flip_three"),
    ]);
  });
});
