import * as Result from "effect/Result";
import { toast } from "sonner";

import type { PlayerColorId } from "@/shared/lib/player-colors";
import type { TrimmedPlayerNameIssue } from "@/shared/lib/player-name-validation";
import type { AppError } from "@/shared/lib/errors/domain";
import { getTrimmedPlayerNameIssue } from "@/shared/lib/player-name-validation";

export interface ExecuteMatchSubmissionOptions<T extends { matchId: string }> {
  name: string;
  selectedColorId: PlayerColorId;
  sessionId: string | null | undefined;
  setName: (name: string) => void;
  setColorId: (colorId: PlayerColorId) => void;
  setIsSubmitting: (submitting: boolean) => void;
  getPlayerNameIssueToast: (issue: TrimmedPlayerNameIssue) => string;
  translateError: (error: AppError) => string;
  onSuccess: (matchId: string) => void;
  perform: (trimmedName: string) => Promise<Result.Result<T, AppError>>;
  getFallbackErrorToast: () => string;
}

export async function executeMatchSubmission<T extends { matchId: string }>({
  name,
  selectedColorId,
  sessionId,
  setName,
  setColorId,
  setIsSubmitting,
  getPlayerNameIssueToast,
  translateError,
  onSuccess,
  perform,
  getFallbackErrorToast,
}: ExecuteMatchSubmissionOptions<T>): Promise<void> {
  const trimmedName = name.trim();

  setName(trimmedName);
  setColorId(selectedColorId);

  const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
  if (nameIssue) {
    toast.error(getPlayerNameIssueToast(nameIssue));
    return;
  }

  setIsSubmitting(true);

  try {
    const result = await perform(trimmedName);
    if (Result.isFailure(result)) {
      toast.error(translateError(result.failure));
      return;
    }

    onSuccess(result.success.matchId);
  } catch {
    toast.error(getFallbackErrorToast());
  } finally {
    setIsSubmitting(false);
  }
}

export async function performHomeJoinByCode({
  joinByCode,
  joinMatch,
  lobbyCode,
  playerName,
  playerColorId,
}: {
  joinByCode: (args: {
    lobbyCode: string;
  }) => Promise<Result.Result<{ matchId: string }, AppError>>;
  joinMatch: (args: {
    matchId: string;
    playerName: string;
    playerColorId: PlayerColorId;
  }) => Promise<Result.Result<{ matchId: string }, AppError>>;
  lobbyCode: string;
  playerName: string;
  playerColorId: PlayerColorId;
}): Promise<Result.Result<{ matchId: string }, AppError>> {
  const lookup = await joinByCode({
    lobbyCode: lobbyCode.toUpperCase(),
  });
  if (Result.isFailure(lookup)) {
    return lookup;
  }
  const joined = await joinMatch({
    matchId: lookup.success.matchId,
    playerName,
    playerColorId,
  });
  if (Result.isFailure(joined)) {
    return joined;
  }
  return Result.succeed({ matchId: lookup.success.matchId });
}
