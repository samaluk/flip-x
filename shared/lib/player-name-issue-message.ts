import type { TrimmedPlayerNameIssue } from "@/shared/lib/player-name-validation";

export function playerNameIssueMessage(
  issue: TrimmedPlayerNameIssue,
  messages: Record<TrimmedPlayerNameIssue, string>,
): string {
  return messages[issue];
}
