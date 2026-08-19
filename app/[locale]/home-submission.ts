import * as Either from "effect/Either";
import { toast } from "sonner";

import type { PlayerColorId } from "@/shared/lib/player-colors";
import type { AppError } from "@/shared/lib/errors/domain";
import { translateAppErrorToast } from "@/shared/lib/convex-error";
import {
  getTrimmedPlayerNameIssue,
  PLAYER_NAME_ISSUE_TOAST_KEY,
} from "@/shared/lib/player-name-validation";

export type MatchSetupToastKey =
  | "toastNameRequired"
  | "toastNameLength"
  | "toastSession"
  | "toastCreateFailed"
  | "toastJoinFailed"
  | "toastCodeLength";

export interface ExecuteMatchSubmissionOptions<T extends { matchId: string }> {
  name: string;
  selectedColorId: PlayerColorId;
  sessionId: string | null | undefined;
  setName: (name: string) => void;
  setColorId: (colorId: PlayerColorId) => void;
  setIsSubmitting: (submitting: boolean) => void;
  tSetup: (key: MatchSetupToastKey) => string;
  tErrors: unknown;
  onSuccess: (matchId: string) => void;
  perform: (trimmedName: string) => Promise<Either.Either<T, AppError>>;
  fallbackErrorKey: "toastCreateFailed" | "toastJoinFailed";
}

export async function executeMatchSubmission<T extends { matchId: string }>({
  name,
  selectedColorId,
  sessionId,
  setName,
  setColorId,
  setIsSubmitting,
  tSetup,
  tErrors,
  onSuccess,
  perform,
  fallbackErrorKey,
}: ExecuteMatchSubmissionOptions<T>): Promise<void> {
  const trimmedName = name.trim();

  setName(trimmedName);
  setColorId(selectedColorId);

  const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
  if (nameIssue) {
    toast.error(tSetup(PLAYER_NAME_ISSUE_TOAST_KEY[nameIssue]));
    return;
  }

  setIsSubmitting(true);

  try {
    const result = await perform(trimmedName);
    if (Either.isLeft(result)) {
      toast.error(translateAppErrorToast(result.left, tErrors));
      return;
    }

    onSuccess(result.right.matchId);
  } catch {
    toast.error(tSetup(fallbackErrorKey));
  } finally {
    setIsSubmitting(false);
  }
}
