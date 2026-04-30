import type { MatchSnapshot } from "@/game/logic/view-models";
import type { ActionKind, ModifierCard } from "./card-types";
import type { CardEventPayload } from "./events";

type Translate = (key: string, values?: Record<string, string | number>) => string;

function actionKindLabel(actionKind: ActionKind, tCards: Translate): string {
  return tCards(`action.${actionKind}`);
}

function modifierLabel(modifierValue: ModifierCard["modifierValue"], tCards: Translate): string {
  if (modifierValue === "x2") {
    return tCards("modifier.x2");
  }
  return tCards("modifier.plus", { value: String(modifierValue) });
}

/** Card face label for event copy (number value, modifier, or action name). */
function cardPayloadLabel(payload: CardEventPayload, tCards: Translate): string {
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
  tEvents: Translate,
  tCards: Translate,
): string {
  switch (latest.type) {
    case "pending_action":
      return tEvents("pending_action", {
        action: actionKindLabel(latest.payload.actionKind, tCards),
      });
    case "second_chance_used":
      return tEvents("second_chance_used", {
        duplicate: latest.payload.duplicate,
      });
    case "freeze_applied":
      return tEvents("freeze_applied");
    case "flip_three_targeted":
      return tEvents("flip_three_targeted", {
        cardsRemaining: latest.payload.cardsRemaining,
      });
    case "flip3_hit":
      return tEvents("flip3_hit");
    case "flip3_completed":
      return tEvents("flip3_completed");
    case "deferred_action":
      return tEvents("deferred_action", {
        action: actionKindLabel(latest.payload.actionKind, tCards),
      });
    case "duplicate_bust":
      return tEvents("duplicate_bust", {
        duplicate: latest.payload.duplicate,
      });
    case "number_drawn":
      return tEvents("number_drawn", {
        numberValue: latest.payload.numberValue,
      });
    case "flip7":
      return tEvents("flip7");
    case "modifier_drawn":
      return tEvents("modifier_drawn", {
        modifier: modifierLabel(latest.payload.modifierValue, tCards),
      });
    case "second_chance_held":
      return tEvents("second_chance_held");
    case "second_chance_discarded":
      return tEvents("second_chance_discarded");
    case "second_chance_passed":
      return tEvents("second_chance_passed");
    case "initial_deal":
      return tEvents("initial_deal", { card: cardPayloadLabel(latest.payload, tCards) });
    case "stay":
      return tEvents("stay");
    case "hit":
      return tEvents("hit", { card: cardPayloadLabel(latest.payload, tCards) });
    case "round_scored":
      return tEvents("round_scored", {
        score: latest.payload.finalRoundScore,
      });
    default:
      return tEvents("unknown");
  }
}
