import { describe, expect, it } from "vitest";

import { createRoundRuntime } from "@/game/logic/command-handler";
import { numberCard } from "@/tests/builders/cards";
import { testPlayers3P } from "@/tests/builders/round-runtime";

describe("round runtime", () => {
  it("createRoundRuntime accepts an injected draw pile", () => {
    const customDrawPile = [numberCard("c1", 9), numberCard("c2", 4)];

    const round = createRoundRuntime(testPlayers3P, 3, 1, {
      drawPile: customDrawPile,
    });

    expect(round.roundNumber).toBe(3);
    expect(round.dealerSeat).toBe(1);
    expect(round.drawPile).toEqual(customDrawPile);
    expect(round.drawPile).not.toBe(customDrawPile);
  });
});
