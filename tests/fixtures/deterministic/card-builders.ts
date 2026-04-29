import type { ActionCard, Card, ModifierCard, NumberCard } from "@/game/logic/card-types";

export function numberCard(id: string, numberValue: number): NumberCard {
  return {
    id,
    type: "number",
    label: String(numberValue),
    numberValue,
  };
}

export function modifierCard(id: string, modifierValue: ModifierCard["modifierValue"]): ModifierCard {
  return {
    id,
    type: "modifier",
    label: modifierValue === "x2" ? "x2" : `+${modifierValue}`,
    modifierValue,
  };
}

export function actionCard(id: string, actionKind: ActionCard["actionKind"]): ActionCard {
  return {
    id,
    type: "action",
    label: actionKind,
    actionKind,
  };
}

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
