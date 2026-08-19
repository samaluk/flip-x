"use client";

import { BanIcon, HandIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { assertNever } from "@/shared/lib/utils";
import type { MatchSnapshot } from "@/game/logic/view-models";
import {
  type PendingAction,
  resolveTurnControlsPhase,
  type TurnControlsPhase,
} from "@/game/ui/turn-controls-phase";

export function TurnControls({
  snapshot,
  onHit,
  onStay,
  onStartNextRound,
}: {
  snapshot: MatchSnapshot;
  onHit: () => void;
  onStay: () => void;
  onStartNextRound: () => void;
}) {
  const t = useTranslations("TurnControls");
  const phase = resolveTurnControlsPhase(snapshot);

  switch (phase.kind) {
    case "none":
      return null;
    case "completed_round":
      return <CompletedRoundControls phase={phase} onStartNextRound={onStartNextRound} t={t} />;
    case "pending_resolve":
      return <PendingResolveControls phase={phase} t={t} />;
    case "pending_wait":
      return <PendingWaitControls phase={phase} t={t} />;
    case "active_turn":
      return <ActiveTurnControls phase={phase} onHit={onHit} onStay={onStay} t={t} />;
    default: {
      return assertNever(phase);
    }
  }
}

type TurnControlsTranslations = ReturnType<typeof useTranslations<"TurnControls">>;

function CompletedRoundControls({
  phase,
  onStartNextRound,
  t,
}: {
  phase: Extract<TurnControlsPhase, { kind: "completed_round" }>;
  onStartNextRound: () => void;
  t: TurnControlsTranslations;
}) {
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
}

function PendingResolveControls({
  phase,
  t,
}: {
  phase: Extract<TurnControlsPhase, { kind: "pending_resolve" }>;
  t: TurnControlsTranslations;
}) {
  return (
    <PendingActionControls
      message={pendingResolveMessage(phase.actionKind, t)}
      targetHint={t("selectTargetHint")}
    />
  );
}

function PendingWaitControls({
  phase,
  t,
}: {
  phase: Extract<TurnControlsPhase, { kind: "pending_wait" }>;
  t: TurnControlsTranslations;
}) {
  return <PendingActionControls message={pendingWaitMessage(phase.actionKind, t)} />;
}

function PendingActionControls({ message, targetHint }: { message: string; targetHint?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">{message}</div>
      {targetHint ? <div className="text-xs text-muted-foreground">{targetHint}</div> : null}
    </div>
  );
}

function pendingResolveMessage(
  actionKind: PendingAction["actionKind"],
  t: TurnControlsTranslations,
) {
  return actionKind === "freeze" ? t("freezePrompt") : t("flipThreePrompt");
}

function pendingWaitMessage(actionKind: PendingAction["actionKind"], t: TurnControlsTranslations) {
  return actionKind === "freeze" ? t("waitingFreeze") : t("waitingFlipThree");
}

function ActiveTurnControls({
  phase,
  onHit,
  onStay,
  t,
}: {
  phase: Extract<TurnControlsPhase, { kind: "active_turn" }>;
  onHit: () => void;
  onStay: () => void;
  t: TurnControlsTranslations;
}) {
  const statusHint = activeTurnStatusHint(phase, t);
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

function activeTurnStatusHint(
  phase: Extract<TurnControlsPhase, { kind: "active_turn" }>,
  t: TurnControlsTranslations,
) {
  if (!phase.hasViewer) {
    return <div className="text-xs text-muted-foreground">{t("claimToPlay")}</div>;
  }
  if (!phase.viewerControlsTurn) {
    return (
      <div className="text-xs text-muted-foreground">
        {t("waitingFor", { name: phase.activeDisplayName })}
      </div>
    );
  }
  if (!phase.optimisticAction) {
    return null;
  }
  return (
    <div className="text-xs text-muted-foreground" aria-live="polite">
      {phase.optimisticAction === "hit" ? t("drawing") : t("staying")}
    </div>
  );
}
