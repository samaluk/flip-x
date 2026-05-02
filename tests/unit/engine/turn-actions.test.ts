import { describe, expect, it } from "vitest";

import { applyCardToPlayer } from "@/game/logic/apply-card";
import { takeTurnAction, resolvePendingAction } from "@/game/logic/command-handler";
import { InvalidTurn, InvalidAction, InvalidTarget } from "@/shared/lib/errors/domain";
import { actionCard, numberCard } from "@/tests/builders/cards";
import { activePlayerHitsDuplicateSeven } from "@/tests/builders/duplicate-seven-hit";
import {
  createTurnRound,
  createActivePlayerStates,
  testPlayers3P,
} from "@/tests/builders/round-runtime";

describe("turn actions", () => {
  it("busts a player when they hit a duplicate number without Second Chance", () => {
    const { playerStates, round } = activePlayerHitsDuplicateSeven();

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("busted");
    expect(resolved.playerStates.p1.pointsAtRisk).toBe(0);
    expect(resolved.playerStates.p1.numberCards).toEqual([numberCard("n1", 7)]);
    expect(resolved.playerStates.p1.bustCard?.numberValue).toBe(7);
    expect(resolved.playerStates.p1.bustCard?.id).toBe("dup");
  });

  it("does not set bustCard when Second Chance prevents a duplicate bust", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.numberCards = [numberCard("n1", 7)];
    playerStates.p1.heldActionCards = [actionCard("sc-1", "second_chance")];
    const round = createTurnRound();
    round.drawPile = [numberCard("dup", 7)];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("active");
    expect(resolved.playerStates.p1.bustCard).toBeNull();
    expect(resolved.playerStates.p1.numberCards).toEqual([numberCard("n1", 7)]);
  });

  it("passes a duplicate Second Chance to the next eligible active player", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.heldActionCards = [actionCard("sc-held", "second_chance")];
    playerStates.p2.heldActionCards = [actionCard("sc-p2", "second_chance")];
    const round = createTurnRound();
    const events = [];

    applyCardToPlayer(
      round,
      testPlayers3P,
      playerStates,
      "p1",
      actionCard("sc-drawn", "second_chance"),
      "turns",
      events,
    );

    expect(playerStates.p1.heldActionCards).toEqual([actionCard("sc-held", "second_chance")]);
    expect(playerStates.p2.heldActionCards).toEqual([actionCard("sc-p2", "second_chance")]);
    expect(playerStates.p3.heldActionCards).toEqual([actionCard("sc-drawn", "second_chance")]);
    expect(round.discardPile).toEqual([]);
    expect(events).toContainEqual(
      expect.objectContaining({
        eventType: "second_chance_passed",
        actorPlayerId: "p1",
        targetPlayerId: "p3",
      }),
    );
  });

  it("discards a duplicate Second Chance when no active player can receive it", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.heldActionCards = [actionCard("sc-held", "second_chance")];
    playerStates.p2.status = "stayed";
    playerStates.p3.status = "busted";
    const round = createTurnRound();
    const duplicateSecondChance = actionCard("sc-drawn", "second_chance");
    const events = [];

    applyCardToPlayer(
      round,
      testPlayers3P,
      playerStates,
      "p1",
      duplicateSecondChance,
      "turns",
      events,
    );

    expect(playerStates.p1.heldActionCards).toEqual([actionCard("sc-held", "second_chance")]);
    expect(round.discardPile).toEqual([duplicateSecondChance]);
    expect(events).toContainEqual(
      expect.objectContaining({
        eventType: "second_chance_discarded",
        actorPlayerId: "p1",
        targetPlayerId: null,
      }),
    );
  });

  it("rejects staying during Flip Three", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 2,
      deferredActionCards: [],
    };

    expect(() => takeTurnAction(testPlayers3P, round, playerStates, "p1", "stay")).toThrowError(
      InvalidTurn,
    );
  });

  it("rejects resolving an action when none is pending", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingAction = null;

    expect(() => resolvePendingAction(testPlayers3P, round, playerStates, "p2")).toThrowError(
      InvalidAction,
    );
  });

  it("rejects resolving an action with an invalid target", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingAction = {
      sourcePlayerId: "p1",
      actionKind: "freeze",
      eligibleTargetIds: ["p2"],
      resume: "turns",
    };

    expect(() => resolvePendingAction(testPlayers3P, round, playerStates, "p3")).toThrowError(
      InvalidTarget,
    );
  });
});
