import type { MatchSnapshot } from "@/game/logic/view-models";

type Translate = (key: string, values?: Record<string, string | number>) => string;

function actionKindLabel(actionKind: unknown, tCards: Translate): string {
  if (actionKind === "flip_three" || actionKind === "freeze" || actionKind === "second_chance") {
    return tCards(`action.${actionKind}`);
  }
  return String(actionKind);
}

function modifierLabel(modifierValue: unknown, tCards: Translate): string {
  if (modifierValue === "x2") {
    return tCards("modifier.x2");
  }
  if (typeof modifierValue === "number") {
    return tCards("modifier.plus", { value: modifierValue });
  }
  return String(modifierValue);
}

/** Card face label for event copy (number value, modifier, or action name). */
export function cardPayloadLabel(payload: Record<string, unknown>, tCards: Translate): string {
  const cardKind = payload.cardKind;
  if (cardKind === "number" && typeof payload.numberValue === "number") {
    return String(payload.numberValue);
  }
  if (cardKind === "modifier") {
    return modifierLabel(payload.modifierValue, tCards);
  }
  if (cardKind === "action") {
    return actionKindLabel(payload.actionKind, tCards);
  }
  return "";
}

export function formatLatestRoundEventBody(
  latest: NonNullable<MatchSnapshot["latestEvent"]>,
  tEvents: Translate,
  tCards: Translate,
): string {
  const p = latest.payload;

  switch (latest.type) {
    case "pending_action":
      return tEvents("pending_action", {
        action: actionKindLabel(p.actionKind, tCards),
      });
    case "second_chance_used":
      return tEvents("second_chance_used", {
        duplicate: typeof p.duplicate === "number" ? p.duplicate : 0,
      });
    case "freeze_applied":
      return tEvents("freeze_applied");
    case "flip_three_targeted":
      return tEvents("flip_three_targeted", {
        cardsRemaining: typeof p.cardsRemaining === "number" ? p.cardsRemaining : 3,
      });
    case "flip3_hit":
      return tEvents("flip3_hit");
    case "flip3_completed":
      return tEvents("flip3_completed");
    case "deferred_action":
      return tEvents("deferred_action", {
        action: actionKindLabel(p.actionKind, tCards),
      });
    case "duplicate_bust":
      return tEvents("duplicate_bust", {
        duplicate: typeof p.duplicate === "number" ? p.duplicate : 0,
      });
    case "number_drawn":
      return tEvents("number_drawn", {
        numberValue: typeof p.numberValue === "number" ? p.numberValue : 0,
      });
    case "flip7":
      return tEvents("flip7");
    case "modifier_drawn":
      return tEvents("modifier_drawn", {
        modifier: modifierLabel(p.modifierValue, tCards),
      });
    case "second_chance_held":
      return tEvents("second_chance_held");
    case "second_chance_discarded":
      return tEvents("second_chance_discarded");
    case "second_chance_passed":
      return tEvents("second_chance_passed");
    case "initial_deal":
      return tEvents("initial_deal", { card: cardPayloadLabel(p, tCards) });
    case "stay":
      return tEvents("stay");
    case "hit":
      return tEvents("hit", { card: cardPayloadLabel(p, tCards) });
    case "round_scored":
      return tEvents("round_scored", {
        score: typeof p.finalRoundScore === "number" ? p.finalRoundScore : 0,
      });
    default:
      return tEvents("unknown");
  }
}
