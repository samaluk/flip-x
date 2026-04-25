import { describe, expect, it } from "vitest";

import { buildOrderedDeck } from "@/game/logic/card-types";

describe("card deck", () => {
  it("buildOrderedDeck returns the full deck without shuffling", () => {
    const deck = buildOrderedDeck();

    expect(deck).toHaveLength(94);
    expect(deck[0]).toMatchObject({ type: "number", numberValue: 0 });
    expect(deck[1]).toMatchObject({ type: "number", numberValue: 1 });
    expect(deck[2]).toMatchObject({ type: "number", numberValue: 2 });
  });
});
