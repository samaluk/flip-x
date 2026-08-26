"use client";

import { useExtracted } from "next-intl";

import type { ActionKind } from "@/game/logic/card-types";
import type { ModifierCard } from "@/game/logic/card-types";
import type { CardEventPayload } from "@/game/logic/events";
import type { MatchSnapshot } from "@/game/logic/view-models";

type CardLabels = {
  flipThree: string;
  freeze: string;
  secondChance: string;
  x2: string;
  plusValue: (value: string) => string;
};

function actionKindLabel(actionKind: ActionKind, labels: CardLabels) {
  switch (actionKind) {
    case "flip_three":
      return labels.flipThree;
    case "freeze":
      return labels.freeze;
    case "second_chance":
      return labels.secondChance;
    default: {
      const exhaustiveCheck: never = actionKind;
      return exhaustiveCheck;
    }
  }
}

function modifierLabel(modifierValue: ModifierCard["modifierValue"], labels: CardLabels) {
  if (modifierValue === "x2") {
    return labels.x2;
  }
  return labels.plusValue(String(modifierValue));
}

function cardPayloadLabel(payload: CardEventPayload, labels: CardLabels) {
  if (payload.cardKind === "number") {
    return String(payload.numberValue);
  }
  if (payload.cardKind === "modifier") {
    return modifierLabel(payload.modifierValue, labels);
  }
  return actionKindLabel(payload.actionKind, labels);
}

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

  if (!latest) {
    return tEvents("No table event has been logged yet.");
  }

  switch (latest.type) {
    case "pending_action":
      return tEvents("{action} is waiting for a target.", {
        action: actionKindLabel(latest.payload.actionKind, cardLabels),
      });
    case "second_chance_used":
      return tEvents(
        "Second Chance discarded duplicate {duplicate} instead of busting the player.",
        {
          duplicate: String(latest.payload.duplicate),
        },
      );
    case "freeze_applied":
      return tEvents("Frozen! Points banked and out of round.");
    case "flip_three_targeted":
      return tEvents("Flip Three targeted! {cardsRemaining} cards to draw.", {
        cardsRemaining: String(latest.payload.cardsRemaining),
      });
    case "flip3_hit":
      return tEvents("Card drawn.");
    case "flip3_completed":
      return tEvents("Flip Three completed!");
    case "deferred_action":
      return tEvents("{action} was queued until Flip Three finished.", {
        action: actionKindLabel(latest.payload.actionKind, cardLabels),
      });
    case "duplicate_bust":
      return tEvents("Drew duplicate {duplicate} — bust!", {
        duplicate: String(latest.payload.duplicate),
      });
    case "number_drawn":
      return tEvents("Revealed number {numberValue}.", {
        numberValue: String(latest.payload.numberValue),
      });
    case "flip7":
      return tEvents("Triggered flip-x!");
    case "modifier_drawn":
      return tEvents("Player revealed modifier {modifier}.", {
        modifier: modifierLabel(latest.payload.modifierValue, cardLabels),
      });
    case "second_chance_held":
      return tEvents("Player stored a Second Chance card.");
    case "second_chance_discarded":
      return tEvents("Extra Second Chance was discarded because no eligible recipient existed.");
    case "second_chance_passed":
      return tEvents("Extra Second Chance was passed to another active player.");
    case "initial_deal":
      return tEvents("Initial deal revealed {card} for the player.", {
        card: cardPayloadLabel(latest.payload, cardLabels),
      });
    case "stay":
      return tEvents("Stayed and banked points.");
    case "hit":
      return tEvents("Hit and revealed {card}.", {
        card: cardPayloadLabel(latest.payload, cardLabels),
      });
    case "round_scored":
      return tEvents("Round scored at {score} points.", {
        score: String(latest.payload.finalRoundScore),
      });
    default:
      return tEvents("Table event recorded.");
  }
}
