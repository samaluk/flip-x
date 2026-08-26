import type { ActionKind } from "@/game/logic/card-types";
import type { ExtractedTranslator } from "@/shared/i18n/extracted-translator";

export function actionKindLabel(actionKind: ActionKind, t: ExtractedTranslator): string {
  switch (actionKind) {
    case "flip_three":
      return t("Flip Three");
    case "freeze":
      return t("Freeze");
    case "second_chance":
      return t("Second Chance");
    default: {
      const exhaustiveCheck: never = actionKind;
      return exhaustiveCheck;
    }
  }
}
