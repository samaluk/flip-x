import { isModifierCard, isNumberCard, type Card } from "./card-types";

export type RoundEvent = {
  eventType: string;
  actorPlayerId: string | null;
  targetPlayerId: string | null;
  payload: Record<string, unknown>;
};

export function cardEventPayload(card: Card): Record<string, unknown> {
  if (isNumberCard(card)) {
    return { cardKind: "number", numberValue: card.numberValue };
  }
  if (isModifierCard(card)) {
    return { cardKind: "modifier", modifierValue: card.modifierValue };
  }
  return { cardKind: "action", actionKind: card.actionKind };
}

export function addEvent(events: RoundEvent[], event: RoundEvent) {
  events.push(event);
}
