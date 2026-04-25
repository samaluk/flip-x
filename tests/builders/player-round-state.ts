import type { PlayerRoundState } from "@/game/logic/round-state";

export function playerRoundState(
  overrides: Partial<PlayerRoundState> & Pick<PlayerRoundState, "playerId">,
): PlayerRoundState {
  return {
    status: "active",
    numberCards: [],
    bustCard: null,
    modifierCards: [],
    heldActionCards: [],
    receivedActionCards: [],
    roundScore: 0,
    pointsAtRisk: 0,
    hasFlip7: false,
    ...overrides,
  };
}
