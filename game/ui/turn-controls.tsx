"use client";

import { BanIcon, HandIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { assertNever } from "@/shared/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import type { MatchSnapshot } from "@/game/logic/view-models";

type PendingAction = NonNullable<MatchSnapshot["pendingAction"]>;

type TurnControlsPhase =
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

function resolveTurnControlsPhase(snapshot: MatchSnapshot): TurnControlsPhase {
  if (snapshot.status === "completed") {
    return { kind: "none" };
  }
  if (snapshot.roundStatus === "completed") {
    return { kind: "completed_round", hasViewer: !!snapshot.viewerPlayerId };
  }
  return pendingActionPhase(snapshot) ?? activeTurnPhase(snapshot);
}

export function TurnControls({
  snapshot,
  onHit,
  onStay,
  onStartNextRound,
}: {
  snapshot: MatchSnapshot;
  onHit: () => void;
  onStay: () => void;
  /* unused - targeting now happens in PlayerLane */
  onResolveAction?: (playerId: Id<"players">) => void;
  onStartNextRound: () => void;
}) {
  const t = useTranslations("TurnControls");
  const phase = resolveTurnControlsPhase(snapshot);

  switch (phase.kind) {
    case "none":
      return null;
    case "completed_round":
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onStartNextRound}
            disabled={!phase.hasViewer}
            size="lg"
            className="rounded-full px-6"
          >
            <SparklesIcon />
            {t("startNextRound")}
          </Button>
        </div>
      );
    case "pending_resolve":
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">
            {phase.actionKind === "freeze" ? t("freezePrompt") : t("flipThreePrompt")}
          </div>
          <div className="text-xs text-muted-foreground">{t("selectTargetHint")}</div>
        </div>
      );
    case "pending_wait":
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">
            {phase.actionKind === "freeze" ? t("waitingFreeze") : t("waitingFlipThree")}
          </div>
        </div>
      );
    case "active_turn": {
      const statusHint = !phase.hasViewer ? (
        <div className="text-xs text-muted-foreground">{t("claimToPlay")}</div>
      ) : !phase.viewerControlsTurn ? (
        <div className="text-xs text-muted-foreground">
          {t("waitingFor", { name: phase.activeDisplayName })}
        </div>
      ) : phase.optimisticAction ? (
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {phase.optimisticAction === "hit" ? t("drawing") : t("staying")}
        </div>
      ) : null;
      const turnPending = phase.optimisticAction !== null;

      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onHit}
            disabled={!phase.viewerControlsTurn || turnPending}
            size="lg"
            className="rounded-full px-6"
          >
            <HandIcon />
            {phase.optimisticAction === "hit"
              ? t("drawing")
              : phase.isInFlip3
                ? t("hitFlip3", { count: String(phase.flip3CardsRemaining) })
                : t("hitFor", { name: phase.activeDisplayName })}
          </Button>
          <Button
            variant="outline"
            onClick={onStay}
            disabled={!phase.viewerControlsTurn || phase.isInFlip3 || turnPending}
            size="lg"
            className="rounded-full px-6"
          >
            <BanIcon />
            {phase.optimisticAction === "stay"
              ? t("staying")
              : t("stayFor", { name: phase.activeDisplayName })}
          </Button>
          {statusHint}
        </div>
      );
    }
    default: {
      return assertNever(phase);
    }
  }
}
