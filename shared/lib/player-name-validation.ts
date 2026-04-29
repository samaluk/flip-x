/** Shared validation for trimmed lobby/player display names (create + join flows). */

type TrimmedPlayerNameIssue = "empty" | "too_long" | "no_session";

/** Message keys shared by MatchSetup and Game namespaces for player-name validation toasts. */
export const PLAYER_NAME_ISSUE_TOAST_KEY = {
  empty: "toastNameRequired",
  too_long: "toastNameLength",
  no_session: "toastSession",
} as const satisfies Record<TrimmedPlayerNameIssue, string>;

/** Returns the first validation issue, or null when the name and session are acceptable. */
export function getTrimmedPlayerNameIssue(
  trimmedName: string,
  sessionId: string | undefined | null,
): TrimmedPlayerNameIssue | null {
  if (!trimmedName) {
    return "empty";
  }
  if (trimmedName.length > 20) {
    return "too_long";
  }
  if (!sessionId) {
    return "no_session";
  }
  return null;
}
