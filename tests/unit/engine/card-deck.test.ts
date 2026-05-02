import { describe, expect, it } from "vitest";

import { buildOrderedDeck } from "@/game/logic/card-types";
import { normalizeAndValidateGameSettings } from "@/game/logic/game-settings";

describe("card deck", () => {
  it("buildOrderedDeck returns the full deck without shuffling", () => {
    const deck = buildOrderedDeck();

    expect(deck).toHaveLength(94);
    expect(deck[0]).toMatchObject({ type: "number", numberValue: 0 });
    expect(deck[1]).toMatchObject({ type: "number", numberValue: 1 });
    expect(deck[2]).toMatchObject({ type: "number", numberValue: 2 });
  });

  it("builds an extended deck through the configured max number card", () => {
    const deck = buildOrderedDeck({ maxNumberCardValue: 14 });
    const numberValues = deck
      .filter((card) => card.type === "number")
      .map((card) => card.numberValue);
    const modifierValues = deck
      .filter((card) => card.type === "modifier")
      .map((card) => card.modifierValue);

    expect(deck).toHaveLength(122);
    expect(Math.min(...numberValues)).toBe(0);
    expect(Math.max(...numberValues)).toBe(14);
    expect(modifierValues).toEqual([2, 4, 6, 8, 10, 12, "x2"]);
  });

  it("derives modifiers from the configured max number card", () => {
    const modifierValues = buildOrderedDeck({ maxNumberCardValue: 20 })
      .filter((card) => card.type === "modifier")
      .map((card) => card.modifierValue);

    expect(modifierValues).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, "x2"]);
  });

  it("rejects invalid game settings", () => {
    expect(() => normalizeAndValidateGameSettings({ targetScore: 199 })).toThrow();
    expect(() => normalizeAndValidateGameSettings({ maxNumberCardValue: 10 })).toThrow();
    expect(() => normalizeAndValidateGameSettings({ maxNumberCardValue: 13 })).toThrow();
  });
});
