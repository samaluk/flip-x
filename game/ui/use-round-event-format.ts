"use client";

import { useExtracted } from "next-intl";

import type { ActionKind } from "@/game/logic/card-types";
import type { ModifierCard } from "@/game/logic/card-types";
import type { CardEventPayload, RoundEventType } from "@/game/logic/events";
import type { LatestRoundEvent } from "@/game/logic/latest-round-event";
import type { MatchSnapshot } from "@/game/logic/view-models";

type CardLabels = {
  flipThree: string;
  freeze: string;
  secondChance: string;
  x2: string;
  plusValue: (value: string) => string;
};

type CardContext = {
  actionLabels: Record<ActionKind, string>;
  cardLabels: CardLabels;
};

function modifierLabel(modifierValue: ModifierCard["modifierValue"], labels: CardLabels) {
  if (modifierValue === "x2") {
    return labels.x2;
  }
  return labels.plusValue(String(modifierValue));
}

function cardPayloadLabel(payload: CardEventPayload, context: CardContext): string {
  if (payload.cardKind === "number") {
    return String(payload.numberValue);
  }
  if (payload.cardKind === "modifier") {
    return modifierLabel(payload.modifierValue, context.cardLabels);
  }
  return context.actionLabels[payload.actionKind];
}

function asCardPayload(payload: LatestRoundEvent["payload"]): CardEventPayload {
  if (
    "cardKind" in payload &&
    (payload.cardKind === "number" ||
      payload.cardKind === "modifier" ||
      payload.cardKind === "action")
  ) {
    return payload;
  }
  return { cardKind: "number", numberValue: 0 };
}

function payloadValue(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

function actionKindFromPayload(payload: Record<string, unknown>): ActionKind {
  if (payload.actionKind === "freeze" || payload.actionKind === "second_chance") {
    return payload.actionKind;
  }
  return "flip_three";
}

function modifierFromPayload(payload: Record<string, unknown>, labels: CardLabels): string {
  if (payload.modifierValue === "x2") {
    return labels.x2;
  }
  return labels.plusValue(payloadValue(payload, "modifierValue"));
}

type RoundEventFormatter = (event: LatestRoundEvent) => string;

export function useLatestRoundEventBody(latest: MatchSnapshot["latestEvent"]): string {
  const tEvents = useExtracted("Events");
  const tCards = useExtracted("Cards");
  const cardLabels: CardLabels = {
    flipThree: tCards("Flip Three"),
    freeze: tCards("Freeze"),
    secondChance: tCards("Second Chance"),
    x2: tCards("×2"),
    plusValue: (value) => tCards("+{value}", { value }),
  };
  const actionLabels: Record<ActionKind, string> = {
    flip_three: cardLabels.flipThree,
    freeze: cardLabels.freeze,
    second_chance: cardLabels.secondChance,
  };
  const cardContext: CardContext = { actionLabels, cardLabels };

  if (!latest) {
    return tEvents("No table event has been logged yet.");
  }

  const formatters: Record<RoundEventType, RoundEventFormatter> = {
    pending_action: (event) =>
      tEvents("{action} is waiting for a target.", {
        action: actionLabels[actionKindFromPayload(event.payload)],
      }),
    second_chance_used: (event) =>
      tEvents("Second Chance discarded duplicate {duplicate} instead of busting the player.", {
        duplicate: payloadValue(event.payload, "duplicate"),
      }),
    freeze_applied: (_event) => tEvents("Frozen! Points banked and out of round."),
    flip_three_targeted: (event) =>
      tEvents("Flip Three targeted! {cardsRemaining} cards to draw.", {
        cardsRemaining: payloadValue(event.payload, "cardsRemaining"),
      }),
    flip3_hit: (_event) => tEvents("Card drawn."),
    flip3_completed: (_event) => tEvents("Flip Three completed!"),
    deferred_action: (event) =>
      tEvents("{action} was queued until Flip Three finished.", {
        action: actionLabels[actionKindFromPayload(event.payload)],
      }),
    duplicate_bust: (event) =>
      tEvents("Drew duplicate {duplicate} — bust!", {
        duplicate: payloadValue(event.payload, "duplicate"),
      }),
    number_drawn: (event) =>
      tEvents("Revealed number {numberValue}.", {
        numberValue: payloadValue(event.payload, "numberValue"),
      }),
    flip7: (_event) => tEvents("Triggered flip-x!"),
    modifier_drawn: (event) =>
      tEvents("Player revealed modifier {modifier}.", {
        modifier: modifierFromPayload(event.payload, cardLabels),
      }),
    second_chance_held: (_event) => tEvents("Player stored a Second Chance card."),
    second_chance_discarded: (_event) =>
      tEvents("Extra Second Chance was discarded because no eligible recipient existed."),
    second_chance_passed: (_event) =>
      tEvents("Extra Second Chance was passed to another active player."),
    initial_deal: (event) =>
      tEvents("Initial deal revealed {card} for the player.", {
        card: cardPayloadLabel(asCardPayload(event.payload), cardContext),
      }),
    stay: (_event) => tEvents("Stayed and banked points."),
    hit: (event) =>
      tEvents("Hit and revealed {card}.", {
        card: cardPayloadLabel(asCardPayload(event.payload), cardContext),
      }),
    round_scored: (event) =>
      tEvents("Round scored at {score} points.", {
        score: payloadValue(event.payload, "finalRoundScore"),
      }),
  };

  return formatters[latest.type](latest);
}
