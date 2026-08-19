import type { Card } from "@/game/logic/card-types";

import { actionCard, numberCard, modifierCard } from "@/tests/builders/cards";

/** Filler tail used by deterministic replay scenarios (no modifier filler). */
export function withReplayFillerCards(...cards: Card[]) {
  return [
    ...cards,
    numberCard("fill-1", 11),
    numberCard("fill-2", 12),
    actionCard("fill-3", "second_chance"),
  ];
}

/** Replay fillers plus modifier filler for setup scenarios that mirror production decks. */
export function withSetupFillerCards(...cards: Card[]) {
  return [...withReplayFillerCards(...cards), modifierCard("fill-4", 2)];
}
