import * as Either from "effect/Either";
import { toast } from "sonner";

import type { ExtractedTranslator } from "@/shared/i18n/extracted-translator";
import { translateAppErrorToast } from "@/shared/lib/convex-error";
import type { AppError } from "@/shared/lib/errors/domain";

export async function toastEitherMutationFailure(
  resultPromise: Promise<Either.Either<unknown, AppError>>,
  options: {
    missingMessage: string;
    tErrors: ExtractedTranslator;
  },
): Promise<Either.Either<unknown, AppError> | null> {
  const result = await resultPromise.catch(() => null);
  if (!result) {
    toast.error(options.missingMessage);
    return null;
  }
  if (Either.isLeft(result)) {
    toast.error(translateAppErrorToast(result.left, options.tErrors));
    return result;
  }
  return result;
}
