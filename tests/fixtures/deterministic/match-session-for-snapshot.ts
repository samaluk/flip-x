/** Match named test sessions to snapshot player rows (displayName ↔ playerId). */

export type MatchPlayersRow = {
  displayName: string;
  playerId: string;
};

export type SnapshotWithActivePlayer = {
  activePlayerId: string | null;
  players: readonly MatchPlayersRow[];
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
    players: readonly MatchPlayersRow[];
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

/** Minimal slice for advance-until-round-boundary loops; satisfied by Confect `MatchSnapshot`. */
export type SnapshotForRoundBoundaryAdvance = SnapshotWithActivePlayer & {
  roundStatus: string | null;
  version: number;
  pendingFlip3: unknown;
  pendingAction:
    | null
    | undefined
    | {
        sourcePlayerId: string;
        eligibleTargetIds: readonly string[];
      };
};

export type RoundBoundaryAdvanceClassification<
  Snap extends SnapshotForRoundBoundaryAdvance,
  S extends { name: string; sessionId: unknown },
> =
  | { kind: "no-snapshot" }
  | { kind: "terminal"; snapshot: Snap }
  | { kind: "pending-action"; snapshot: Snap; sourceSession: S }
  | { kind: "active-turn"; snapshot: Snap };

export type RoundBoundaryAdvanceAfterLoad<
  Snap extends SnapshotForRoundBoundaryAdvance,
  S extends { name: string; sessionId: unknown },
> = Exclude<RoundBoundaryAdvanceClassification<Snap, S>, { kind: "no-snapshot" }>;

/** Like {@link classifyRoundBoundaryAdvanceStep}, but throws if the snapshot was missing (same message as replay harnesses). */
export function classifyRoundBoundaryAdvanceStepOrThrow<
  Snap extends SnapshotForRoundBoundaryAdvance,
  S extends { name: string; sessionId: unknown },
>(
  snapshot: Snap | null | undefined,
  sessions: S[],
): RoundBoundaryAdvanceAfterLoad<Snap, S> {
  const step = classifyRoundBoundaryAdvanceStep(snapshot, sessions);
  if (step.kind === "no-snapshot") {
    throw new Error("Expected a match snapshot while resolving gameplay");
  }
  return step;
}

export function classifyRoundBoundaryAdvanceStep<
  Snap extends SnapshotForRoundBoundaryAdvance,
  S extends { name: string; sessionId: unknown },
>(
  snapshot: Snap | null | undefined,
  sessions: S[],
): RoundBoundaryAdvanceClassification<Snap, S> {
  if (!snapshot) {
    return { kind: "no-snapshot" };
  }
  if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
    return { kind: "terminal", snapshot };
  }
  if (snapshot.pendingAction) {
    const sourceSession = requireSourceSessionForPendingAction(
      snapshot,
      sessions,
      "Expected a source session for pending action",
    );
    return { kind: "pending-action", snapshot, sourceSession };
  }
  return { kind: "active-turn", snapshot };
}
