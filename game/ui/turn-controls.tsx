"use client";

import { BanIcon, HandIcon, SparklesIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { assertNever } from "@/shared/lib/utils";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { resolveTurnControlsPhase, type TurnControlsPhase } from "@/game/ui/turn-controls-phase";

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
  const phase = resolveTurnControlsPhase(snapshot);

  switch (phase.kind) {
    case "none":
      return null;
    case "completed_round":
      return <CompletedRoundControls phase={phase} onStartNextRound={onStartNextRound} />;
    case "pending_resolve":
      return <PendingResolveControls phase={phase} />;
    case "pending_wait":
      return <PendingWaitControls phase={phase} />;
    case "active_turn":
      return <ActiveTurnControls phase={phase} onHit={onHit} onStay={onStay} />;
    default: {
      return assertNever(phase);
    }
  }
}

function CompletedRoundControls({
  phase,
  onStartNextRound,
}: {
  phase: Extract<TurnControlsPhase, { kind: "completed_round" }>;
  onStartNextRound: () => void;
}) {
  const t = useExtracted("TurnControls");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={onStartNextRound}
        disabled={!phase.hasViewer}
        size="lg"
        className="rounded-full px-6"
      >
        <SparklesIcon />
        {t("Start next round")}
      </Button>
    </div>
  );
}

function PendingResolveControls({
  phase,
}: {
  phase: Extract<TurnControlsPhase, { kind: "pending_resolve" }>;
}) {
  const t = useExtracted("TurnControls");
  const message =
    phase.actionKind === "freeze"
      ? t("Choose who banks their points and freezes out of the round.")
      : t("Choose who must keep drawing until three cards resolve.");

  return (
    <PendingActionControls
      message={message}
      targetHint={t("Click a player lane to select target")}
    />
  );
}

function PendingWaitControls({
  phase,
}: {
  phase: Extract<TurnControlsPhase, { kind: "pending_wait" }>;
}) {
  const t = useExtracted("TurnControls");
  const message =
    phase.actionKind === "freeze" ? t("Freeze being resolved...") : t("Flip 3 being resolved...");

  return <PendingActionControls message={message} />;
}

function PendingActionControls({ message, targetHint }: { message: string; targetHint?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">{message}</div>
      {targetHint ? <div className="text-xs text-muted-foreground">{targetHint}</div> : null}
    </div>
  );
}

function ActiveTurnControls({
  phase,
  onHit,
  onStay,
}: {
  phase: Extract<TurnControlsPhase, { kind: "active_turn" }>;
  onHit: () => void;
  onStay: () => void;
}) {
  const t = useExtracted("TurnControls");
  const turnPending = phase.optimisticAction !== null;

  let statusHint: ReactNode = null;
  if (!phase.hasViewer) {
    statusHint = (
      <div className="text-xs text-muted-foreground">
        {t("Join the game from this device to play.")}
      </div>
    );
  } else if (!phase.viewerControlsTurn) {
    statusHint = (
      <div className="text-xs text-muted-foreground">
        {t("Waiting for {name}.", { name: phase.activeDisplayName })}
      </div>
    );
  } else if (phase.optimisticAction) {
    statusHint = (
      <div className="text-xs text-muted-foreground" aria-live="polite">
        {phase.optimisticAction === "hit" ? t("Drawing...") : t("Staying...")}
      </div>
    );
  }

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
          ? t("Drawing...")
          : phase.isInFlip3
            ? t("Draw ({count})", { count: String(phase.flip3CardsRemaining) })
            : t("Hit for {name}", { name: phase.activeDisplayName })}
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
          ? t("Staying...")
          : t("Stay for {name}", { name: phase.activeDisplayName })}
      </Button>
      {statusHint}
    </div>
  );
}
