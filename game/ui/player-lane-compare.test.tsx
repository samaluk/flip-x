import { describe, expect, it } from "vitest";

import type { ModifierCard, NumberCard } from "@/game/logic/card-types";
import {
  areActionCardsEqual,
  areModifierCardsEqual,
  areNumberCardsEqual,
  arePlayerLanePropsEqual,
  arePlayersEqual,
  getDisplayStatus,
  type PlayerLaneProps,
  type SnapshotPlayer,
} from "@/game/ui/player-lane-compare";

function snapshotPlayer(overrides: Partial<SnapshotPlayer> = {}): SnapshotPlayer {
  const base: SnapshotPlayer = {
    playerId: "p1" as SnapshotPlayer["playerId"],
    displayName: "Alex",
    seatIndex: 0,
    totalScore: 12,
    isOnline: true,
    roundStatus: "active",
    pointsAtRisk: 12,
    numberCards: [],
    modifierCards: [],
    heldActionCards: [],
    receivedActionCards: [],
    scoreBreakdown: {
      additiveModifierTotal: 0,
      finalRoundScore: 12,
      flip7Bonus: 0,
      multipliedTotal: 12,
      multiplierApplied: false,
      numberCardTotal: 12,
    },
    bustCard: null,
  };
  return { ...base, ...overrides };
}

function laneProps(overrides: Partial<PlayerLaneProps> = {}): PlayerLaneProps {
  return {
    player: snapshotPlayer(),
    isActive: false,
    ...overrides,
  };
}

describe("arePlayerLanePropsEqual", () => {
  it("returns true for identical props", () => {
    const props = laneProps();
    expect(arePlayerLanePropsEqual(props, { ...props })).toBe(true);
  });

  it("returns false when a scalar prop differs", () => {
    const left = laneProps({ isActive: false });
    const right = laneProps({ isActive: true });
    expect(arePlayerLanePropsEqual(left, right)).toBe(false);
  });

  it("returns true when onSelectTarget identity changes but truthiness stays the same", () => {
    const left = laneProps({ onSelectTarget: () => {} });
    const right = laneProps({ onSelectTarget: () => {} });
    expect(arePlayerLanePropsEqual(left, right)).toBe(true);
  });

  it("returns false when onSelectTarget truthiness flips", () => {
    const withCallback = laneProps({ onSelectTarget: () => {} });
    const withoutCallback = laneProps({ onSelectTarget: undefined });
    expect(arePlayerLanePropsEqual(withCallback, withoutCallback)).toBe(false);
    expect(arePlayerLanePropsEqual(withoutCallback, withCallback)).toBe(false);
  });

  it("returns false when the player snapshot differs", () => {
    const left = laneProps();
    const right = laneProps({ player: snapshotPlayer({ displayName: "Riley" }) });
    expect(arePlayerLanePropsEqual(left, right)).toBe(false);
  });
});

describe("arePlayersEqual", () => {
  it("returns true for identical players", () => {
    const player = snapshotPlayer();
    expect(arePlayersEqual(player, { ...player })).toBe(true);
  });

  it("returns false when a scalar field differs", () => {
    const left = snapshotPlayer({ totalScore: 12 });
    const right = snapshotPlayer({ totalScore: 30 });
    expect(arePlayersEqual(left, right)).toBe(false);
  });

  it("returns false when the card count differs", () => {
    const left = snapshotPlayer({
      numberCards: [{ id: "n1", type: "number", label: "7", numberValue: 7 } satisfies NumberCard],
    });
    const right = snapshotPlayer({ numberCards: [] });
    expect(arePlayersEqual(left, right)).toBe(false);
  });

  it("returns false when a card value differs at the same count", () => {
    const card: NumberCard = { id: "n1", type: "number", label: "7", numberValue: 7 };
    const left = snapshotPlayer({ numberCards: [card] });
    const right = snapshotPlayer({
      numberCards: [{ ...card, numberValue: 8 }],
    });
    expect(arePlayersEqual(left, right)).toBe(false);
  });
});

describe("card comparators", () => {
  it("areNumberCardsEqual: empty arrays are equal", () => {
    expect(areNumberCardsEqual([], [])).toBe(true);
  });

  it("areNumberCardsEqual: same content in a different order is not equal (order-sensitive)", () => {
    const cardA: NumberCard = { id: "n1", type: "number", label: "7", numberValue: 7 };
    const cardB: NumberCard = { id: "n2", type: "number", label: "8", numberValue: 8 };
    expect(areNumberCardsEqual([cardA, cardB], [cardB, cardA])).toBe(false);
  });

  it("areNumberCardsEqual: different number value is not equal", () => {
    const cardA: NumberCard = { id: "n1", type: "number", label: "7", numberValue: 7 };
    const cardB = { ...cardA, numberValue: 8 };
    expect(areNumberCardsEqual([cardA], [cardB])).toBe(false);
  });

  it("areModifierCardsEqual: empty arrays are equal", () => {
    expect(areModifierCardsEqual([], [])).toBe(true);
  });

  it("areModifierCardsEqual: same content in a different order is not equal (order-sensitive)", () => {
    const cardA: ModifierCard = { id: "m1", type: "modifier", label: "x2", modifierValue: 2 };
    const cardB: ModifierCard = { id: "m2", type: "modifier", label: "+5", modifierValue: 5 };
    expect(areModifierCardsEqual([cardA, cardB], [cardB, cardA])).toBe(false);
  });

  it("areModifierCardsEqual: different modifier value is not equal", () => {
    const cardA: ModifierCard = { id: "m1", type: "modifier", label: "x2", modifierValue: 2 };
    const cardB = { ...cardA, modifierValue: 3 };
    expect(areModifierCardsEqual([cardA], [cardB])).toBe(false);
  });

  it("areActionCardsEqual: empty arrays are equal", () => {
    expect(areActionCardsEqual([], [])).toBe(true);
  });

  it("areActionCardsEqual: same content in a different order is not equal (order-sensitive)", () => {
    const freeze = { label: "freeze", actionKind: "freeze" as const };
    const flipThree = { label: "flip three", actionKind: "flip_three" as const };
    expect(areActionCardsEqual([freeze, flipThree], [flipThree, freeze])).toBe(false);
  });

  it("areActionCardsEqual: different actionKind is not equal", () => {
    const cardA = { label: "freeze", actionKind: "freeze" as const };
    const cardB = { ...cardA, actionKind: "flip_three" as const };
    expect(areActionCardsEqual([cardA], [cardB])).toBe(false);
  });

  it("areActionCardsEqual: same label and kind with different length is not equal", () => {
    const cardA = { label: "freeze", actionKind: "freeze" as const };
    expect(areActionCardsEqual([cardA], [cardA, cardA])).toBe(false);
  });
});

describe("getDisplayStatus", () => {
  it("bustCard overrides roundStatus", () => {
    expect(
      getDisplayStatus(
        snapshotPlayer({ bustCard: { id: "n1", type: "number", label: "7", numberValue: 7 } }),
      ),
    ).toBe("busted");
    expect(getDisplayStatus(snapshotPlayer({ roundStatus: "busted" }))).toBe("busted");
  });
});
