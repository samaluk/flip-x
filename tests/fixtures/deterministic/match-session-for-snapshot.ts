/** Match named test sessions to snapshot player rows (displayName ↔ playerId). */

export type MatchPlayersRow = {
  displayName: string;
  playerId: string;
};

export type SnapshotWithActivePlayer = {
  activePlayerId: string | null;
  players: MatchPlayersRow[];
};

/** Resolves the session whose player is currently active; throws if none match. */
export function requireActiveSessionForSnapshot<
  S extends { name: string },
>(
  snapshot: SnapshotWithActivePlayer,
  sessions: S[],
  errorMessage: string,
): S {
  const activeSession = sessions.find(
    (session) =>
      snapshot.activePlayerId ===
      snapshot.players.find((player) => player.displayName === session.name)?.playerId,
  );
  if (!activeSession) {
    throw new Error(errorMessage);
  }
  return activeSession;
}

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
