"use client";

import { useExtracted } from "next-intl";

import type { ActionKind } from "@/game/logic/card-types";
import type { ModifierCard } from "@/game/logic/card-types";
import type { CardEventPayload } from "@/game/logic/events";
import type { MatchSnapshot } from "@/game/logic/view-models";

type CardTranslator = ReturnType<typeof useExtracted>;

function actionKindLabel(actionKind: ActionKind, tCards: CardTranslator) {
  switch (actionKind) {
    case "flip_three":
      return tCards("Flip Three");
    case "freeze":
      return tCards("Freeze");
    case "second_chance":
      return tCards("Second Chance");
    default: {
      const exhaustiveCheck: never = actionKind;
      return exhaustiveCheck;
    }
  }
}

function modifierLabel(modifierValue: ModifierCard["modifierValue"], tCards: CardTranslator) {
  if (modifierValue === "x2") {
    return tCards("×2");
  }
  return tCards("+{value}", { value: String(modifierValue) });
}

function cardPayloadLabel(payload: CardEventPayload, tCards: CardTranslator) {
  if (payload.cardKind === "number") {
    return String(payload.numberValue);
  }
  if (payload.cardKind === "modifier") {
    return modifierLabel(payload.modifierValue, tCards);
  }
  return actionKindLabel(payload.actionKind, tCards);
}

export function useLatestRoundEventBody(latest: MatchSnapshot["latestEvent"]): string {
  const tEvents = useExtracted("Events");
  const tCards = useExtracted("Cards");

  if (!latest) {
    return tEvents("No table event has been logged yet.");
  }

  switch (latest.type) {
    case "pending_action":
      return tEvents("{action} is waiting for a target.", {
        action: actionKindLabel(latest.payload.actionKind, tCards),
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
        action: actionKindLabel(latest.payload.actionKind, tCards),
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
        modifier: modifierLabel(latest.payload.modifierValue, tCards),
      });
    case "second_chance_held":
      return tEvents("Player stored a Second Chance card.");
    case "second_chance_discarded":
      return tEvents("Extra Second Chance was discarded because no eligible recipient existed.");
    case "second_chance_passed":
      return tEvents("Extra Second Chance was passed to another active player.");
    case "initial_deal":
      return tEvents("Initial deal revealed {card} for the player.", {
        card: cardPayloadLabel(latest.payload, tCards),
      });
    case "stay":
      return tEvents("Stayed and banked points.");
    case "hit":
      return tEvents("Hit and revealed {card}.", {
        card: cardPayloadLabel(latest.payload, tCards),
      });
    case "round_scored":
      return tEvents("Round scored at {score} points.", {
        score: String(latest.payload.finalRoundScore),
      });
    default:
      return tEvents("Table event recorded.");
  }
}
