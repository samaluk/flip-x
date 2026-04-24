import { describe, expect, it } from "vitest";
import type { Card } from "@/game/logic/card-types";
import { continueRound, createPlayerRoundStates, createRoundRuntime } from "@/game/logic/command-handler";
import type { RoundRuntime } from "@/game/logic/round-state";

describe("Flip Three dealt as first card", () => {
  it("should allow action resolution when Flip Three is the first card dealt", () => {
    // Setup: 3 players
    const players = [
      { playerId: "p1", seatIndex: 0, displayName: "Alice" },
      { playerId: "p2", seatIndex: 1, displayName: "Bob" },
      { playerId: "p3", seatIndex: 2, displayName: "Charlie" },
    ];

    // Create a deck where the first card is Flip Three
    const flipThreeCard: Card = {
      id: "flip3-1",
      type: "action",
      label: "Flip Three",
      actionKind: "flip_three",
    };
    const normalCards: Card[] = Array.from({ length: 50 }, (_, i) => ({
      id: `num-${i}`,
      type: "number",
      label: String((i % 7) + 1),
      numberValue: ((i % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    }));

    const round = createRoundRuntime(players, 1, 0) as RoundRuntime;
    const initialDrawPile = round.drawPile;
    round.drawPile = [flipThreeCard, ...normalCards];

    const playerStates = createPlayerRoundStates(players);

    // Get ordered players from round
    const orderedPlayers = players.map((p) => ({
      ...p,
      seatIndex: p.seatIndex,
    }));

    console.log("Initial drawPile length:", initialDrawPile.length);
    console.log("Custom drawPile length:", round.drawPile.length);
    console.log("First card:", round.drawPile[0]);

    // Continue round (should deal first card)
    const result = continueRound(orderedPlayers, round, playerStates);

    console.log("round phase:", result.round.phase);
    console.log("round.openingSeatIndex:", result.round.openingSeatIndex);
    console.log("pendingAction:", result.round.pendingAction);
    console.log("p1 heldActionCards:", result.playerStates.p1.heldActionCards);
    console.log("Events:", result.events.map((e) => ({ eventType: e.eventType, actor: e.actorPlayerId })));

    // Expectations:
    // 1. Game should NOT be in "dealing" phase - should be "player_turns" for Flip Three target to hit
    expect(result.round.phase).not.toBe("dealing");
    expect(result.round.phase).toBe("player_turns");

    // 2. When only one active player exists, Flip Three auto-resolves (no pendingAction)
    // Instead, pendingFlip3 is set directly
    expect(result.round.pendingAction).toBeNull();
    expect(result.round.pendingFlip3).toBeDefined();
    expect(result.round.pendingFlip3?.sourcePlayerId).toBe("p1");
    expect(result.round.pendingFlip3?.targetPlayerId).toBe("p1"); // Auto-resolved to self
    expect(result.round.pendingFlip3?.cardsRemaining).toBe(3);

    // 3. Player who drew Flip Three should NOT have it in held cards (it was used)
    expect(result.playerStates.p1.heldActionCards).toHaveLength(0);

    // 4. p1 should now be able to hit for the Flip Three draws
    const isP1Target = result.round.pendingFlip3?.targetPlayerId === "p1";
    expect(isP1Target).toBe(true);
  });
});
