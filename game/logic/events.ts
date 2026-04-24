import {
  isModifierCard,
  isNumberCard,
  type ActionKind,
  type Card,
  type ModifierCard,
} from "./card-types";

type EventBase<TEventType extends string> = {
  eventType: TEventType;
  actorPlayerId: string | null;
  targetPlayerId: string | null;
};

export type CardEventPayload =
  | { cardKind: "number"; numberValue: number }
  | { cardKind: "modifier"; modifierValue: ModifierCard["modifierValue"] }
  | { cardKind: "action"; actionKind: ActionKind };

export type RoundEvent =
  | (EventBase<"initial_deal" | "hit" | "flip3_hit"> & {
      payload: CardEventPayload;
    })
  | (EventBase<"number_drawn"> & {
      payload: { numberValue: number };
    })
  | (EventBase<"modifier_drawn"> & {
      payload: { modifierValue: ModifierCard["modifierValue"] };
    })
  | (EventBase<
      | "second_chance_held"
      | "second_chance_discarded"
      | "flip7"
      | "freeze_applied"
      | "stay"
      | "flip3_completed"
    > & {
      payload: Record<string, never>;
    })
  | (EventBase<"second_chance_passed"> & {
      payload: Record<string, never>;
    })
  | (EventBase<"second_chance_used" | "duplicate_bust"> & {
      payload: { duplicate: number };
    })
  | (EventBase<"deferred_action" | "pending_action"> & {
      payload: { actionKind: ActionKind };
    })
  | (EventBase<"flip_three_targeted"> & {
      payload: { cardsRemaining: number };
    })
  | (EventBase<"round_scored"> & {
      payload: { finalRoundScore: number };
    });

export type RoundEventType = RoundEvent["eventType"];

const roundEventTypes = new Set<RoundEventType>([
  "initial_deal",
  "hit",
  "flip3_hit",
  "number_drawn",
  "modifier_drawn",
  "second_chance_held",
  "second_chance_passed",
  "second_chance_discarded",
  "second_chance_used",
  "duplicate_bust",
  "flip7",
  "freeze_applied",
  "stay",
  "flip_three_targeted",
  "flip3_completed",
  "deferred_action",
  "pending_action",
  "round_scored",
]);

export function isRoundEventType(value: string): value is RoundEventType {
  return roundEventTypes.has(value as RoundEventType);
}

export function cardEventPayload(card: Card): CardEventPayload {
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
