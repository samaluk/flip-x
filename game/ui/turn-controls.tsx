"use client";

import { BanIcon, HandIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import type { MatchSnapshot } from "@/game/logic/view-models";

type PendingAction = NonNullable<MatchSnapshot["pendingAction"]>;

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
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  const viewerControlsTurn = snapshot.viewerPlayerId === snapshot.activePlayerId;
  const viewerCanResolveAction = snapshot.pendingAction?.sourcePlayerId === snapshot.viewerPlayerId;
  const flip3State = snapshot.pendingFlip3;
  const isInFlip3 =
    flip3State &&
    flip3State.targetPlayerId === snapshot.viewerPlayerId &&
    flip3State.cardsRemaining > 0;

  if (snapshot.status === "completed") {
    return null;
  }

  if (snapshot.roundStatus === "completed") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onStartNextRound}
          disabled={!snapshot.viewerPlayerId}
          size="lg"
          className="rounded-full px-6"
        >
          <SparklesIcon />
          {t("startNextRound")}
        </Button>
      </div>
    );
  }

  if (snapshot.pendingAction) {
    const pendingAction: PendingAction = snapshot.pendingAction;

    if (viewerCanResolveAction) {
      return (
        <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border p-4">
          <div className="text-muted-foreground text-sm">
            {pendingAction.actionKind === "freeze" ? t("freezePrompt") : t("flipThreePrompt")}
          </div>
          <div className="text-muted-foreground text-xs">{t("selectTargetHint")}</div>
        </div>
      );
    }

    return (
      <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border p-4">
        <div className="text-muted-foreground text-sm">
          {pendingAction.actionKind === "freeze" ? t("waitingFreeze") : t("waitingFlipThree")}
        </div>
      </div>
    );
  }

  if (!activePlayer || snapshot.roundStatus !== "player_turns") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={onHit}
        disabled={!viewerControlsTurn}
        size="lg"
        className="rounded-full px-6"
      >
        <HandIcon />
        {isInFlip3
          ? t("hitFlip3", { count: flip3State.cardsRemaining })
          : t("hitFor", { name: activePlayer.displayName })}
      </Button>
      <Button
        variant="outline"
        onClick={onStay}
        disabled={!viewerControlsTurn || !!isInFlip3}
        size="lg"
        className="rounded-full px-6"
      >
        <BanIcon />
        {t("stayFor", { name: activePlayer.displayName })}
      </Button>
      {!snapshot.viewerPlayerId ? (
        <div className="text-muted-foreground text-xs">{t("claimToPlay")}</div>
      ) : !viewerControlsTurn ? (
        <div className="text-muted-foreground text-xs">
          {t("waitingFor", { name: activePlayer.displayName })}
        </div>
      ) : null}
    </div>
  );
}
