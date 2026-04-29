/** Match named test sessions to snapshot player rows (displayName ↔ playerId). */

export type MatchPlayersRow = {
  displayName: string;
  playerId: string;
};

/** Resolves the session whose player originated the pending action; throws if none match. */
export function requireSourceSessionForPendingAction<
  S extends { name: string; sessionId: unknown },
>(
  snapshot: {
    pendingAction: { sourcePlayerId: string } | null | undefined;
    players: MatchPlayersRow[];
  },
  sessions: S[],
  errorMessage: string,
): S {
  const sourceSession = sessions.find(
    (session) =>
      snapshot.pendingAction?.sourcePlayerId ===
      snapshot.players.find((player) => player.displayName === session.name)?.playerId,
  );
  if (!sourceSession) {
    throw new Error(errorMessage);
  }
  return sourceSession;
}
