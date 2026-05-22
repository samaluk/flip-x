import { describe, expect, it } from "vitest";

import { applyCardToPlayer } from "@/game/logic/apply-card";
import { resolvePendingAction, takeTurnAction } from "@/game/logic/command-handler";
import { advanceFlip3Hit } from "@/game/logic/flip-three";
import type { RoundEvent } from "@/game/logic/events";
import { actionCard, numberCard, modifierCard } from "@/tests/builders/cards";
import { activePlayerHitsDuplicateSeven } from "@/tests/builders/duplicate-seven-hit";
import {
  createTurnRound,
  createActivePlayerStates,
  testPlayers3P,
} from "@/tests/builders/round-runtime";

type TakeTurnResolved = ReturnType<typeof takeTurnAction>;

describe("flip three", () => {
  it("advances a pending sequence through the Flip Three module interface", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    const events: RoundEvent[] = [];
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 3,
      deferredActionCards: [],
    };

    const advanced = advanceFlip3Hit(
      round,
      testPlayers3P,
      playerStates,
      "p1",
      numberCard("n2", 2),
      (card) => {
        applyCardToPlayer(round, testPlayers3P, playerStates, "p1", card, "turns", events);
      },
      events,
    );

    expect(advanced).toBe(true);
    expect(round.pendingFlip3?.cardsRemaining).toBe(2);
    expect(events.map((event) => event.eventType)).toEqual(["flip3_hit", "number_drawn"]);
  });

  it("keeps the Flip Three target on turn until all required cards are drawn", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 3,
      deferredActionCards: [],
    };
    round.drawPile = [numberCard("n2", 2)];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.round.activePlayerId).toBe("p1");
    expect(resolved.round.pendingFlip3?.cardsRemaining).toBe(2);
  });

  it("moves the active turn to the target after resolving a targeted Flip Three", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.heldActionCards = [actionCard("flip3", "flip_three")];
    const round = createTurnRound();
    round.phase = "resolving_action";
    round.pendingAction = {
      sourcePlayerId: "p1",
      actionKind: "flip_three",
      eligibleTargetIds: ["p1", "p2", "p3"],
      resume: "turns",
    };

    const resolved = resolvePendingAction(testPlayers3P, round, playerStates, "p2");

    expect(resolved.round.pendingFlip3).toMatchObject({
      sourcePlayerId: "p1",
      targetPlayerId: "p2",
      cardsRemaining: 3,
    });
    expect(resolved.round.activePlayerId).toBe("p2");
    expect(resolved.round.turnSeatIndex).toBe(1);
  });

  it("completes Flip Three on the last required draw and advances the turn", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 1,
      deferredActionCards: [],
    };
    round.drawPile = [modifierCard("m2", 2)];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.round.activePlayerId).toBe("p3");
    expect(resolved.events.some((event) => event.eventType === "flip3_completed")).toBe(true);
  });

  it("advances from the original Flip Three player after a different target draws", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.activePlayerId = "p3";
    round.turnSeatIndex = 2;
    round.pendingFlip3 = {
      sourcePlayerId: "p1",
      targetPlayerId: "p3",
      cardsRemaining: 1,
      deferredActionCards: [],
    };
    round.drawPile = [numberCard("n2", 2)];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p3", "hit");

    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.round.activePlayerId).toBe("p2");
    expect(resolved.round.turnSeatIndex).toBe(1);
  });

  it("clears Flip Three when the target busts", () => {
    const { playerStates, round } = activePlayerHitsDuplicateSeven();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 2,
      deferredActionCards: [actionCard("queued-freeze", "freeze")],
    };
    playerStates.p1.heldActionCards = [actionCard("queued-freeze", "freeze")];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("busted");
    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.playerStates.p1.heldActionCards).toHaveLength(0);
    expect(resolved.round.activePlayerId).toBe("p3");
  });

  it("clears Flip Three immediately when the target hits Flip 7", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.numberCards = [
      numberCard("n1", 1),
      numberCard("n2", 2),
      numberCard("n3", 3),
      numberCard("n4", 4),
      numberCard("n5", 5),
      numberCard("n6", 6),
    ];
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 2,
      deferredActionCards: [actionCard("queued-flip3", "flip_three")],
    };
    playerStates.p1.heldActionCards = [actionCard("queued-flip3", "flip_three")];
    round.drawPile = [numberCard("n7", 7)];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.round.phase).toBe("scoring");
    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.playerStates.p1.heldActionCards).toHaveLength(0);
  });

  it.each([
    {
      title: "freeze",
      id: "freeze-1" as const,
      actionKind: "freeze" as const,
      assertExtra: (resolved: TakeTurnResolved) => {
        expect(resolved.playerStates.p1.heldActionCards).toEqual([
          actionCard("freeze-1", "freeze"),
        ]);
        expect(resolved.events.some((event) => event.eventType === "deferred_action")).toBe(true);
      },
    },
    {
      title: "nested Flip Three",
      id: "flip3-1" as const,
      actionKind: "flip_three" as const,
      assertExtra: (resolved: TakeTurnResolved) => {
        expect(resolved.events.some((event) => event.eventType === "flip3_completed")).toBe(true);
      },
    },
  ])(
    "defers %s drawn during Flip Three until the sequence completes",
    ({ id, actionKind, assertExtra }) => {
      const playerStates = createActivePlayerStates();
      const round = createTurnRound();
      round.pendingFlip3 = {
        sourcePlayerId: "p2",
        targetPlayerId: "p1",
        cardsRemaining: 1,
        deferredActionCards: [],
      };
      round.drawPile = [actionCard(id, actionKind)];

      const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

      expect(resolved.round.pendingFlip3).toBeNull();
      expect(resolved.round.pendingAction).toMatchObject({
        sourcePlayerId: "p1",
        actionKind,
      });
      assertExtra(resolved);
    },
  );

  it("preserves a nested Flip Three that auto-resolves to a single active target", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p2.status = "stayed";
    playerStates.p3.status = "stayed";
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 1,
      deferredActionCards: [],
    };
    round.drawPile = [actionCard("flip3-self", "flip_three")];

    const resolved = takeTurnAction(testPlayers3P, round, playerStates, "p1", "hit");

    expect(resolved.round.pendingFlip3).toMatchObject({
      sourcePlayerId: "p1",
      targetPlayerId: "p1",
      cardsRemaining: 3,
    });
  });
});
