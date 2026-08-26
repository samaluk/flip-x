import { translateConvexError, type ErrorCodeTranslator } from "./app-error-wire-code";
import { type AppError, appErrorWireCode } from "./domain";

import type { ExtractedTranslator } from "@/shared/i18n/extracted-translator";

export function translateAppErrorMessage(
  error: AppError,
  translateWireCode: ErrorCodeTranslator,
  t: ExtractedTranslator,
): string {
  return translateConvexError(appErrorWireCode(error), translateWireCode, (detail) =>
    t("{message}", { message: detail }),
  );
}
