import type { Card } from "./card-types";
import type { RoundRuntime } from "./round-state";

export function discardCard(round: RoundRuntime, card: Card) {
  round.discardPile.push(card);
}

export function drawCard(round: RoundRuntime) {
  return round.drawPile.shift() ?? null;
}
