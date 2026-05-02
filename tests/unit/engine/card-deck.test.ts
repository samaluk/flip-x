import { describe, expect, it } from "vitest";

import { buildOrderedDeck } from "@/game/logic/card-types";
import {
  buildGameSettingsSnapshot,
  gameSettingsEqual,
  normalizeAndValidateGameSettings,
  recommendedPresetForPlayerCount,
  settingsFromMatch,
} from "@/game/logic/game-settings";

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

  it("normalizes missing settings to the classic defaults", () => {
    expect(normalizeAndValidateGameSettings({})).toEqual({
      targetScore: 200,
      maxNumberCardValue: 12,
    });
    expect(settingsFromMatch({ targetScore: 250 })).toEqual({
      targetScore: 250,
      maxNumberCardValue: 12,
    });
  });

  it("builds player-facing settings snapshots from the configured deck range", () => {
    expect(buildGameSettingsSnapshot({ targetScore: 300, maxNumberCardValue: 16 })).toEqual({
      targetScore: 300,
      maxNumberCardValue: 16,
      numberCardRange: { min: 0, max: 16 },
      modifierRange: { min: 2, max: 14, includesX2: true },
      modeLabel: "Big Table",
    });
  });

  it("recommends presets by table size", () => {
    expect(recommendedPresetForPlayerCount(2)).toBe("classic");
    expect(recommendedPresetForPlayerCount(5)).toBe("extended");
    expect(recommendedPresetForPlayerCount(6)).toBe("big-table");
  });

  it("compares game settings by stable rule fields", () => {
    expect(
      gameSettingsEqual(
        { targetScore: 200, maxNumberCardValue: 12 },
        { targetScore: 200, maxNumberCardValue: 12 },
      ),
    ).toBe(true);
    expect(
      gameSettingsEqual(
        { targetScore: 200, maxNumberCardValue: 12 },
        { targetScore: 250, maxNumberCardValue: 12 },
      ),
    ).toBe(false);
  });
});
