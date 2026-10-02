import * as Result from "effect/Result";
import { toast } from "sonner";

import type { AppError } from "@/shared/lib/errors/domain";

export async function toastResultMutationFailure(
  resultPromise: Promise<Result.Result<unknown, AppError>>,
  options: {
    missingMessage: string;
    translateError: (error: AppError) => string;
  },
): Promise<Result.Result<unknown, AppError> | null> {
  const result = await resultPromise.catch(() => null);
  if (!result) {
    toast.error(options.missingMessage);
    return null;
  }
  if (Result.isFailure(result)) {
    toast.error(options.translateError(result.failure));
    return result;
  }
  return result;
}
