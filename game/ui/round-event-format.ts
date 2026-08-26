import type { MatchSnapshot } from "@/game/logic/view-models";
import type { ActionKind, ModifierCard } from "@/game/logic/card-types";
import type { CardEventPayload } from "@/game/logic/events";

export type EventTranslator = (message: string, values?: Record<string, string | number>) => string;

// fallow-ignore-next-line code-duplication -- same action-kind switch as flip-x-card; literals must stay at each callsite for extraction.
function actionKindLabel(actionKind: ActionKind, tCards: EventTranslator): string {
  switch (actionKind) {
    case "flip_three":
      return tCards("Flip Three");
    case "freeze":
      return tCards("Freeze");
    case "second_chance":
      return tCards("Second Chance");
  }
}

function modifierLabel(
  modifierValue: ModifierCard["modifierValue"],
  tCards: EventTranslator,
): string {
  if (modifierValue === "x2") {
    return tCards("×2");
  }
  return tCards("+{value}", { value: String(modifierValue) });
}

/** Card face label for event copy (number value, modifier, or action name). */
function cardPayloadLabel(payload: CardEventPayload, tCards: EventTranslator): string {
  if (payload.cardKind === "number") {
    return String(payload.numberValue);
  }
  if (payload.cardKind === "modifier") {
    return modifierLabel(payload.modifierValue, tCards);
  }
  return actionKindLabel(payload.actionKind, tCards);
}

export function formatLatestRoundEventBody(
  latest: NonNullable<MatchSnapshot["latestEvent"]>,
  tEvents: EventTranslator,
  tCards: EventTranslator,
): string {
  switch (latest.type) {
    case "pending_action":
      return tEvents("{action} is waiting for a target.", {
        action: actionKindLabel(latest.payload.actionKind, tCards),
      });
    case "second_chance_used":
      return tEvents(
        "Second Chance discarded duplicate {duplicate} instead of busting the player.",
        {
          duplicate: latest.payload.duplicate,
        },
      );
    case "freeze_applied":
      return tEvents("Frozen! Points banked and out of round.");
    case "flip_three_targeted":
      return tEvents("Flip Three targeted! {cardsRemaining} cards to draw.", {
        cardsRemaining: latest.payload.cardsRemaining,
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
        duplicate: latest.payload.duplicate,
      });
    case "number_drawn":
      return tEvents("Revealed number {numberValue}.", {
        numberValue: latest.payload.numberValue,
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
        score: latest.payload.finalRoundScore,
      });
    default:
      return tEvents("Table event recorded.");
  }
}
