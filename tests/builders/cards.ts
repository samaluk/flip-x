import type { ActionCard, ModifierCard, NumberCard } from "@/game/logic/card-types";

export function numberCard(id: string, value: number): NumberCard {
  return {
    id,
    type: "number",
    label: String(value),
    numberValue: value,
  };
}

export function modifierCard(id: string, value: ModifierCard["modifierValue"]): ModifierCard {
  return {
    id,
    type: "modifier",
    label: String(value),
    modifierValue: value,
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
