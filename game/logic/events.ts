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

type RoundEventType = RoundEvent["eventType"];

type PersistedRoundEvent = {
  eventType: string;
  actorPlayerId: string | null;
  targetPlayerId: string | null;
  payload: unknown;
};

type EncodedRoundEvent = Omit<PersistedRoundEvent, "eventType"> & {
  eventType: RoundEventType;
};

const roundEventTypes = new Set<string>([
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
  return roundEventTypes.has(value);
}

function isActionKind(value: unknown): value is ActionKind {
  return value === "flip_three" || value === "freeze" || value === "second_chance";
}

function isModifierValue(value: unknown): value is ModifierCard["modifierValue"] {
  return value === "x2" || typeof value === "number";
}

function payloadRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Round event payload must be an object");
  }
  return payload as Record<string, unknown>;
}

function decodeCardPayload(payload: unknown): CardEventPayload {
  const record = payloadRecord(payload);

  if (record.cardKind === "number" && typeof record.numberValue === "number") {
    return { cardKind: "number", numberValue: record.numberValue };
  }

  if (record.cardKind === "modifier" && isModifierValue(record.modifierValue)) {
    return { cardKind: "modifier", modifierValue: record.modifierValue };
  }

  if (record.cardKind === "action" && isActionKind(record.actionKind)) {
    return { cardKind: "action", actionKind: record.actionKind };
  }

  throw new Error("Invalid card event payload");
}

function decodeEmptyPayload(payload: unknown): Record<string, never> {
  payloadRecord(payload);
  return {};
}

function decodeNumberPayload(payload: unknown, key: string) {
  const record = payloadRecord(payload);
  const value = record[key];
  if (typeof value !== "number") {
    throw new Error(`Round event payload field ${key} must be a number`);
  }
  return value;
}

function decodeActionPayload(payload: unknown) {
  const record = payloadRecord(payload);
  if (!isActionKind(record.actionKind)) {
    throw new Error("Round event payload field actionKind must be an action kind");
  }
  return { actionKind: record.actionKind };
}

function decodeModifierPayload(payload: unknown) {
  const record = payloadRecord(payload);
  if (!isModifierValue(record.modifierValue)) {
    throw new Error("Round event payload field modifierValue must be a modifier value");
  }
  return { modifierValue: record.modifierValue };
}

export function encodeRoundEvent(event: RoundEvent): EncodedRoundEvent {
  return {
    eventType: event.eventType,
    actorPlayerId: event.actorPlayerId,
    targetPlayerId: event.targetPlayerId,
    payload: event.payload,
  };
}

export function decodeRoundEvent(event: PersistedRoundEvent): RoundEvent {
  const base = {
    actorPlayerId: event.actorPlayerId,
    targetPlayerId: event.targetPlayerId,
  };

  switch (event.eventType) {
    case "initial_deal":
    case "hit":
    case "flip3_hit":
      return { ...base, eventType: event.eventType, payload: decodeCardPayload(event.payload) };
    case "number_drawn":
      return {
        ...base,
        eventType: event.eventType,
        payload: { numberValue: decodeNumberPayload(event.payload, "numberValue") },
      };
    case "modifier_drawn":
      return { ...base, eventType: event.eventType, payload: decodeModifierPayload(event.payload) };
    case "second_chance_held":
    case "second_chance_discarded":
    case "flip7":
    case "freeze_applied":
    case "stay":
    case "flip3_completed":
      return { ...base, eventType: event.eventType, payload: decodeEmptyPayload(event.payload) };
    case "second_chance_passed":
      return { ...base, eventType: event.eventType, payload: decodeEmptyPayload(event.payload) };
    case "second_chance_used":
    case "duplicate_bust":
      return {
        ...base,
        eventType: event.eventType,
        payload: { duplicate: decodeNumberPayload(event.payload, "duplicate") },
      };
    case "deferred_action":
    case "pending_action":
      return { ...base, eventType: event.eventType, payload: decodeActionPayload(event.payload) };
    case "flip_three_targeted":
      return {
        ...base,
        eventType: event.eventType,
        payload: { cardsRemaining: decodeNumberPayload(event.payload, "cardsRemaining") },
      };
    case "round_scored":
      return {
        ...base,
        eventType: event.eventType,
        payload: { finalRoundScore: decodeNumberPayload(event.payload, "finalRoundScore") },
      };
    default:
      throw new Error(`Unknown round event type: ${event.eventType}`);
  }
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
