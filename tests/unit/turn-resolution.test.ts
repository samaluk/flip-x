import { describe, expect, it } from "vitest";

import type { NumberCard } from "@/game/logic/card-types";
import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  takeTurnAction,
  type PlayerRoundState,
  type RoundRuntime,
} from "@/game/logic/turn-resolution";

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
    round.drawPile = [numberCard("dup", 7)];

    const resolved = takeTurnAction(players, round, playerStates, "p1", "hit");

    expect(resolved.playerStates.p1.status).toBe("busted");
    expect(resolved.playerStates.p1.pointsAtRisk).toBe(0);
  });
});
