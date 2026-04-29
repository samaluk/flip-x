import { numberCard } from "@/tests/builders/cards";
import { createActivePlayerStates, createTurnRound } from "@/tests/builders/round-runtime";

/** Active player holds a 7 and will bust by drawing another 7 on hit. */
export function activePlayerHitsDuplicateSeven() {
  const playerStates = createActivePlayerStates();
  playerStates.p1.numberCards = [numberCard("n1", 7)];
  const round = createTurnRound();
  round.drawPile = [numberCard("dup", 7)];
  return { playerStates, round };
}
