import { describe, expect, it } from "vitest";

import { buildOrderedDeck } from "@/game/logic/card-types";
import type { ActionCard, ModifierCard, NumberCard } from "@/game/logic/card-types";
import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  resolvePendingAction,
  takeTurnAction,
} from "@/game/logic/command-handler";
import type { PlayerRoundState, RoundRuntime } from "@/game/logic/round-state";
import { InvalidAction, InvalidTarget, InvalidTurn } from "@/shared/lib/errors/domain";

const players = [
  { playerId: "p1", seatIndex: 0 },
  { playerId: "p2", seatIndex: 1 },
  { playerId: "p3", seatIndex: 2 },
];

function numberCard(id: string, value: number): NumberCard {
  return {
    id,
    type: "number",
    label: String(value),
    numberValue: value,
  };
}

function modifierCard(id: string, value: ModifierCard["modifierValue"]): ModifierCard {
  return {
    id,
    type: "modifier",
    label: String(value),
    modifierValue: value,
  };
}

function actionCard(id: string, actionKind: ActionCard["actionKind"]): ActionCard {
  return {
    id,
    type: "action",
    label: actionKind,
    actionKind,
  };
}

function createTurnRound(): RoundRuntime {
  const round = createRoundRuntime(players, 1, 0) as RoundRuntime;
  round.phase = "player_turns";
  round.activePlayerId = "p1";
  round.turnSeatIndex = 0;
  return round;
}

function createActivePlayerStates() {
  const playerStates = createPlayerRoundStates(players) as Record<string, PlayerRoundState>;
  playerStates.p1.status = "active";
  playerStates.p2.status = "active";
  playerStates.p3.status = "active";
  return playerStates;
}

describe("turn resolution", () => {
  it("deals the opening round and advances to player turns", () => {
    const playerStates = createPlayerRoundStates(players);
    const round = createRoundRuntime(players, 1, 0);

    round.drawPile = [numberCard("c1", 1), numberCard("c2", 2), numberCard("c3", 3)];

    const resolved = continueRound(players, round, playerStates);

    expect(resolved.round.phase).toBe("player_turns");
    expect(resolved.playerStates.p1.numberCards[0]?.numberValue).toBe(1);
    expect(resolved.playerStates.p2.numberCards[0]?.numberValue).toBe(2);
    expect(resolved.playerStates.p3.numberCards[0]?.numberValue).toBe(3);
  });

  it("deals every player when round 2 starts with dealer seat 1 in a three-player game", () => {
    const playerStates = createPlayerRoundStates(players);
    const round = createRoundRuntime(players, 2, 1);

    round.drawPile = [numberCard("c1", 1), numberCard("c2", 2), numberCard("c3", 3)];

    const resolved = continueRound(players, round, playerStates);

    expect(resolved.round.phase).toBe("player_turns");
    expect(resolved.playerStates.p2.numberCards[0]?.numberValue).toBe(1);
    expect(resolved.playerStates.p3.numberCards[0]?.numberValue).toBe(2);
    expect(resolved.playerStates.p1.numberCards[0]?.numberValue).toBe(3);
  });

  it("deals both players when round 2 starts with dealer seat 1 in a two-player game", () => {
    const twoPlayers = [
      { playerId: "p1", seatIndex: 0 },
      { playerId: "p2", seatIndex: 1 },
    ];
    const playerStates = createPlayerRoundStates(twoPlayers);
    const round = createRoundRuntime(twoPlayers, 2, 1);

    round.drawPile = [numberCard("c1", 4), numberCard("c2", 9)];

    const resolved = continueRound(twoPlayers, round, playerStates);

    expect(resolved.round.phase).toBe("player_turns");
    expect(resolved.playerStates.p2.numberCards[0]?.numberValue).toBe(4);
    expect(resolved.playerStates.p1.numberCards[0]?.numberValue).toBe(9);
  });

  it("resumes opening deal from the next undealt seat after a pending action resolves", () => {
    const fourPlayers = [
      { playerId: "p1", seatIndex: 0 },
      { playerId: "p2", seatIndex: 1 },
      { playerId: "p3", seatIndex: 2 },
      { playerId: "p4", seatIndex: 3 },
    ];
    const playerStates = createPlayerRoundStates(fourPlayers);
    const round = createRoundRuntime(fourPlayers, 1, 0);

    round.drawPile = [
      numberCard("c1", 1),
      numberCard("c2", 2),
      actionCard("freeze-opening", "freeze"),
      numberCard("c4", 4),
    ];

    const paused = continueRound(fourPlayers, round, playerStates);

    expect(paused.round.phase).toBe("resolving_action");
    expect(paused.round.pendingAction).toMatchObject({
      sourcePlayerId: "p3",
      actionKind: "freeze",
      resume: "dealing",
    });

    const resumed = resolvePendingAction(
      fourPlayers,
      paused.round,
      paused.playerStates,
      "p1",
    );

    expect(resumed.round.phase).toBe("player_turns");
    expect(resumed.playerStates.p4.numberCards[0]?.numberValue).toBe(4);
    expect(resumed.playerStates.p1.receivedActionCards).toEqual([
      actionCard("freeze-opening", "freeze"),
    ]);
  });

  it("buildOrderedDeck returns the full deck without shuffling", () => {
    const deck = buildOrderedDeck();

    expect(deck).toHaveLength(94);
    expect(deck[0]).toMatchObject({ type: "number", numberValue: 0 });
    expect(deck[1]).toMatchObject({ type: "number", numberValue: 1 });
    expect(deck[2]).toMatchObject({ type: "number", numberValue: 2 });
  });

  it("createRoundRuntime accepts an injected draw pile", () => {
    const customDrawPile = [numberCard("c1", 9), numberCard("c2", 4)];

    const round = createRoundRuntime(players, 3, 1, {
      drawPile: customDrawPile,
    });

    expect(round.roundNumber).toBe(3);
    expect(round.dealerSeat).toBe(1);
    expect(round.drawPile).toEqual(customDrawPile);
    expect(round.drawPile).not.toBe(customDrawPile);
  });

  it("busts a player when they hit a duplicate number without Second Chance", () => {
    const playerStates = createPlayerRoundStates(players) as Record<string, PlayerRoundState>;
    playerStates.p1.status = "active";
    playerStates.p1.numberCards = [numberCard("n1", 7)];
    playerStates.p2.status = "active";
    playerStates.p3.status = "active";

    const round = createRoundRuntime(players, 1, 0) as RoundRuntime;
    round.phase = "player_turns";
    round.activePlayerId = "p1";
    round.turnSeatIndex = 0;
    const dupCard = numberCard("dup", 7);
    round.drawPile = [dupCard];

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("busted");
    expect(resolved.playerStates.p1.pointsAtRisk).toBe(0);
    expect(resolved.playerStates.p1.numberCards).toEqual([numberCard("n1", 7)]);
    expect(resolved.playerStates.p1.bustCard?.numberValue).toBe(7);
    expect(resolved.playerStates.p1.bustCard?.id).toBe("dup");
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

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.round.activePlayerId).toBe("p1");
    expect(resolved.round.pendingFlip3?.cardsRemaining).toBe(2);
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

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.round.activePlayerId).toBe("p2");
    expect(resolved.events.some((event) => event.eventType === "flip3_completed")).toBe(true);
  });

  it("clears Flip Three when the target busts", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.numberCards = [numberCard("n1", 7)];
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 2,
      deferredActionCards: [actionCard("queued-freeze", "freeze")],
    };
    playerStates.p1.heldActionCards = [actionCard("queued-freeze", "freeze")];
    round.drawPile = [numberCard("dup", 7)];

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("busted");
    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.playerStates.p1.heldActionCards).toHaveLength(0);
    expect(resolved.round.activePlayerId).toBe("p2");
  });

  it("does not set bustCard when Second Chance prevents a duplicate bust", () => {
    const playerStates = createActivePlayerStates();
    playerStates.p1.numberCards = [numberCard("n1", 7)];
    playerStates.p1.heldActionCards = [actionCard("sc-1", "second_chance")];
    const round = createTurnRound();
    round.drawPile = [numberCard("dup", 7)];

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("active");
    expect(resolved.playerStates.p1.bustCard).toBeNull();
    expect(resolved.playerStates.p1.numberCards).toEqual([numberCard("n1", 7)]);
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

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.round.phase).toBe("scoring");
    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.playerStates.p1.heldActionCards).toHaveLength(0);
  });

  it("defers freeze drawn during Flip Three until the sequence completes", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 1,
      deferredActionCards: [],
    };
    round.drawPile = [actionCard("freeze-1", "freeze")];

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.round.pendingAction).toMatchObject({
      sourcePlayerId: "p1",
      actionKind: "freeze",
    });
    expect(resolved.playerStates.p1.heldActionCards).toEqual([actionCard("freeze-1", "freeze")]);
    expect(resolved.events.some((event) => event.eventType === "deferred_action")).toBe(true);
  });

  it("defers nested Flip Three draws until the current Flip Three completes", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingFlip3 = {
      sourcePlayerId: "p2",
      targetPlayerId: "p1",
      cardsRemaining: 1,
      deferredActionCards: [],
    };
    round.drawPile = [actionCard("flip3-1", "flip_three")];

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.round.pendingFlip3).toBeNull();
    expect(resolved.round.pendingAction).toMatchObject({
      sourcePlayerId: "p1",
      actionKind: "flip_three",
    });
    expect(resolved.events.some((event) => event.eventType === "flip3_completed")).toBe(true);
  });

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

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.round.pendingFlip3).toMatchObject({
      sourcePlayerId: "p1",
      targetPlayerId: "p1",
      cardsRemaining: 3,
    });
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

    expect(() => takeTurnAction(players, round, playerStates, "p1", "stay")).toThrowError(
      InvalidTurn,
    );
  });

  it("rejects resolving an action when none is pending", () => {
    const playerStates = createActivePlayerStates();
    const round = createTurnRound();
    round.pendingAction = null;

    expect(() => resolvePendingAction(players, round, playerStates, "p2")).toThrowError(
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

    expect(() => resolvePendingAction(players, round, playerStates, "p3")).toThrowError(
      InvalidTarget,
    );
  });
});
