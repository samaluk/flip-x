import { describe, expect, it } from "vitest";

import { countDeckCards } from "@/game/logic/card-types";
import { scoreRound, computeScoreBreakdown } from "@/game/logic/scoring";
import type { PlayerRoundState } from "@/game/logic/round-state";

describe("scoreRound", () => {
  it("builds the official 94-card Flip 7 deck", () => {
    expect(countDeckCards()).toBe(94);
  });

  it("applies x2 before additive modifiers and Flip 7 bonus", () => {
    const breakdown = scoreRound(
      [
        { id: "n1", type: "number", label: "11", numberValue: 11 },
        { id: "n2", type: "number", label: "5", numberValue: 5 },
        { id: "n3", type: "number", label: "12", numberValue: 12 },
      ],
      [
        { id: "m1", type: "modifier", label: "x2", modifierValue: "x2" },
        { id: "m2", type: "modifier", label: "+4", modifierValue: 4 },
      ],
      true,
    );

    expect(breakdown.numberCardTotal).toBe(28);
    expect(breakdown.multipliedTotal).toBe(56);
    expect(breakdown.additiveModifierTotal).toBe(4);
    expect(breakdown.flip7Bonus).toBe(15);
    expect(breakdown.finalRoundScore).toBe(75);
  });

  it("scores repeated calculations quickly enough for table updates", () => {
    const startedAt = performance.now();

    for (let index = 0; index < 1_000; index += 1) {
      scoreRound(
        [
          { id: `n-${index}-1`, type: "number", label: "11", numberValue: 11 },
          { id: `n-${index}-2`, type: "number", label: "5", numberValue: 5 },
          { id: `n-${index}-3`, type: "number", label: "12", numberValue: 12 },
        ],
        [
          { id: `m-${index}-1`, type: "modifier", label: "x2", modifierValue: "x2" },
          { id: `m-${index}-2`, type: "modifier", label: "+4", modifierValue: 4 },
        ],
        false,
      );
    }

    const duration = performance.now() - startedAt;
    expect(duration).toBeLessThan(50);
  });
});

describe("computeScoreBreakdown", () => {
  it("returns all zeros for a busted player", () => {
    const bustedState: PlayerRoundState = {
      playerId: "p1",
      status: "busted",
      numberCards: [{ id: "n1", type: "number", label: "5", numberValue: 5 }],
      modifierCards: [{ id: "m1", type: "modifier", label: "x2", modifierValue: "x2" }],
      heldActionCards: [],
      receivedActionCards: [],
      roundScore: 0,
      pointsAtRisk: 0,
      hasFlip7: false,
      bustCard: { id: "n2", type: "number", label: "5", numberValue: 5 },
    };

    const breakdown = computeScoreBreakdown(bustedState);

    expect(breakdown.finalRoundScore).toBe(0);
    expect(breakdown.numberCardTotal).toBe(0);
    expect(breakdown.multiplierApplied).toBe(false);
  });

  it("returns normal score for a non-busted player", () => {
    const playerState: PlayerRoundState = {
      playerId: "p1",
      status: "active",
      numberCards: [{ id: "n1", type: "number", label: "5", numberValue: 5 }],
      modifierCards: [],
      heldActionCards: [],
      receivedActionCards: [],
      roundScore: 0,
      pointsAtRisk: 0,
      hasFlip7: false,
      bustCard: null,
    };

    const breakdown = computeScoreBreakdown(playerState);

    expect(breakdown.numberCardTotal).toBe(5);
    expect(breakdown.finalRoundScore).toBe(5);
  });

  it("returns all zeros when bustCard is set, ignoring hand cards", () => {
    const bustedState: PlayerRoundState = {
      playerId: "p1",
      status: "busted",
      numberCards: [
        { id: "n1", type: "number", label: "11", numberValue: 11 },
        { id: "n2", type: "number", label: "5", numberValue: 5 },
        { id: "n3", type: "number", label: "12", numberValue: 12 },
      ],
      modifierCards: [
        { id: "m1", type: "modifier", label: "x2", modifierValue: "x2" },
        { id: "m2", type: "modifier", label: "+4", modifierValue: 4 },
      ],
      heldActionCards: [],
      receivedActionCards: [],
      roundScore: 0,
      pointsAtRisk: 0,
      hasFlip7: true,
      bustCard: { id: "n4", type: "number", label: "5", numberValue: 5 },
    };

    const breakdown = computeScoreBreakdown(bustedState);

    // Would be 75 with cards (28*2 + 4 + 15), but bust = 0
    expect(breakdown.finalRoundScore).toBe(0);
  });
});
