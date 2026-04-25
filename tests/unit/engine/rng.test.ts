import { describe, expect, it } from "vitest";

import { buildOrderedDeck, createDeck } from "@/game/logic/card-types";
import { createPlayerRoundStates, createRoundRuntime } from "@/game/logic/command-handler";
import { createProductionRng, fixedRng } from "@/game/logic/rng";

describe("rng", () => {
  it("keeps the ordered deck with fixedRng", () => {
    expect(createDeck(fixedRng)).toEqual(buildOrderedDeck());
  });

  it("uses the injected rng when creating a round runtime", () => {
    const players = [
      { playerId: "p1", seatIndex: 0 },
      { playerId: "p2", seatIndex: 1 },
    ];
    const round = createRoundRuntime(players, 1, 0, { rng: fixedRng });

    expect(round.drawPile).toEqual(buildOrderedDeck());
    expect(createPlayerRoundStates(players).p1.status).toBe("waiting");
  });

  it("supports deterministic production rng construction", () => {
    const rng = createProductionRng(() => 0);

    expect(rng.shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
  });
});
