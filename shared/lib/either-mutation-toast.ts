import * as Either from "effect/Either";
import { toast } from "sonner";

import type { AppError } from "@/shared/lib/errors/domain";

export async function toastEitherMutationFailure(
  resultPromise: Promise<Either.Either<unknown, AppError>>,
  options: {
    missingMessage: string;
    translateError: (error: AppError) => string;
  },
): Promise<Either.Either<unknown, AppError> | null> {
  const result = await resultPromise.catch(() => null);
  if (!result) {
    toast.error(options.missingMessage);
    return null;
  }
  if (Either.isLeft(result)) {
    toast.error(options.translateError(result.left));
    return result;
  }
  return result;
}
