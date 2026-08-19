import type { MatchSnapshot } from "@/game/logic/view-models";

export type PendingAction = NonNullable<MatchSnapshot["pendingAction"]>;

export type TurnControlsPhase =
  | { kind: "none" }
  | { kind: "completed_round"; hasViewer: boolean }
  | {
      kind: "pending_resolve";
      actionKind: PendingAction["actionKind"];
    }
  | {
      kind: "pending_wait";
      actionKind: PendingAction["actionKind"];
    }
  | {
      kind: "active_turn";
      viewerControlsTurn: boolean;
      hasViewer: boolean;
      isInFlip3: boolean;
      flip3CardsRemaining: number;
      activeDisplayName: string;
      optimisticAction: "hit" | "stay" | null;
    };

function pendingActionPhase(snapshot: MatchSnapshot): TurnControlsPhase | null {
  const pending = snapshot.pendingAction;
  if (!pending) {
    return null;
  }
  const viewerCanResolve = pending.sourcePlayerId === snapshot.viewerPlayerId;
  return viewerCanResolve
    ? { kind: "pending_resolve", actionKind: pending.actionKind }
    : { kind: "pending_wait", actionKind: pending.actionKind };
}

function activeTurnPhase(snapshot: MatchSnapshot): TurnControlsPhase {
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  if (!activePlayer || snapshot.roundStatus !== "player_turns") {
    return { kind: "none" };
  }
  const viewerControlsTurn = snapshot.viewerPlayerId === snapshot.activePlayerId;
  const flip3State = snapshot.pendingFlip3;
  const isInFlip3 =
    !!flip3State &&
    flip3State.targetPlayerId === snapshot.viewerPlayerId &&
    flip3State.cardsRemaining > 0;

  return {
    kind: "active_turn",
    viewerControlsTurn,
    hasViewer: !!snapshot.viewerPlayerId,
    isInFlip3,
    flip3CardsRemaining: flip3State?.cardsRemaining ?? 0,
    activeDisplayName: activePlayer.displayName,
    optimisticAction:
      snapshot.optimisticTurn?.playerId === snapshot.viewerPlayerId
        ? snapshot.optimisticTurn.action
        : null,
  };
}

export function resolveTurnControlsPhase(snapshot: MatchSnapshot): TurnControlsPhase {
  if (snapshot.status === "completed") {
    return { kind: "none" };
  }
  if (snapshot.roundStatus === "completed") {
    return { kind: "completed_round", hasViewer: !!snapshot.viewerPlayerId };
  }
  return pendingActionPhase(snapshot) ?? activeTurnPhase(snapshot);
}
