/** Shared validation for trimmed lobby/player display names (create + join flows). */

export type TrimmedPlayerNameIssue = "empty" | "too_long" | "no_session";

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
