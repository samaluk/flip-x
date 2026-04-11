"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { Flip7Card } from "@/components/game/flip7-card";
import { Badge } from "@/components/ui/badge";
import type { MatchSnapshot } from "@/lib/game/view-models";
import { cn } from "@/lib/utils";

function statusKey(status: MatchSnapshot["players"][number]["roundStatus"]) {
  switch (status) {
    case "active":
      return "statusActive";
    case "busted":
      return "statusBusted";
    case "stayed":
      return "statusStayed";
    case "frozen":
      return "statusFrozen";
    case "completed":
      return "statusCompleted";
    default:
      return "statusWaiting";
  }
}

function statusVariant(status: MatchSnapshot["players"][number]["roundStatus"]) {
  switch (status) {
    case "busted":
      return "destructive" as const;
    case "stayed":
    case "frozen":
    case "completed":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function PlayerLane({
  player,
  isActive,
  isDealer = false,
  isViewer = false,
  isPinned = false,
  compact = false,
}: {
  player: MatchSnapshot["players"][number];
  isActive: boolean;
  isDealer?: boolean;
  isViewer?: boolean;
  isPinned?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("PlayerLane");
  const previousCardIds = useRef<string[]>([]);
  const previousStatus = useRef(player.roundStatus);
  const [dealingIds, setDealingIds] = useState<string[]>([]);
  const [stateAnimation, setStateAnimation] = useState<"bust" | "stay" | null>(null);

  const cardIds = useMemo(
    () => [
      ...player.modifierCards.map((card) => card.id),
      ...player.numberCards.map((card) => card.id),
      ...player.heldActionCards.map(
        (card) => `${player.playerId}-${card.actionKind}-${card.label}`,
      ),
    ],
    [player.heldActionCards, player.modifierCards, player.numberCards, player.playerId],
  );

  useEffect(() => {
    const newIds = cardIds.filter((id) => !previousCardIds.current.includes(id));

    if (newIds.length > 0) {
      setDealingIds(newIds);
      const timeout = window.setTimeout(() => setDealingIds([]), 750);
      previousCardIds.current = cardIds;
      return () => window.clearTimeout(timeout);
    }

    previousCardIds.current = cardIds;
  }, [cardIds]);

  useEffect(() => {
    if (previousStatus.current === player.roundStatus) {
      return;
    }

    if (player.roundStatus === "busted") {
      setStateAnimation("bust");
    } else if (player.roundStatus === "stayed" || player.roundStatus === "frozen") {
      setStateAnimation("stay");
    }

    previousStatus.current = player.roundStatus;

    if (
      player.roundStatus === "busted" ||
      player.roundStatus === "stayed" ||
      player.roundStatus === "frozen"
    ) {
      const timeout = window.setTimeout(() => setStateAnimation(null), 900);
      return () => window.clearTimeout(timeout);
    }
  }, [player.roundStatus]);

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground transition-shadow duration-300",
        isActive && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        isDealer && "border-primary/30",
        isPinned && "border-primary/30 bg-primary/[0.03]",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-medium tracking-tight text-foreground">
              {player.displayName}
            </h3>
            <Badge variant="outline" className="text-[0.65rem]">
              {t("seat", { n: player.seatIndex + 1 })}
            </Badge>
            {isDealer ? (
              <Badge variant="default" className="text-[0.65rem]">
                {t("dealer")}
              </Badge>
            ) : null}
            {isViewer ? (
              <Badge
                variant="default"
                className="text-[0.65rem] bg-primary/15 text-primary border-primary/30"
              >
                {t("you")}
              </Badge>
            ) : null}
            {player.isClaimed && !isViewer ? (
              <Badge variant="secondary" className="text-[0.65rem]">
                {t("claimed")}
              </Badge>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">
            {t("totalScore", { score: player.totalScore })}
          </div>
        </div>

        {!compact && (
          <div className="grid min-w-[9rem] gap-0.5 text-right text-sm">
            <Badge variant={statusVariant(player.roundStatus)} className="justify-end text-[0.65rem]">
              {t(statusKey(player.roundStatus))}
            </Badge>
            <div className="text-2xl font-semibold text-foreground tabular-nums">{player.pointsAtRisk}</div>
            <div className="text-xs text-muted-foreground">{t("pointsAtRisk")}</div>
          </div>
        )}
      </div>

      <div className={cn("mt-3 flex flex-wrap", compact ? "gap-2" : "gap-3")}>
        {player.modifierCards.map((card) => (
          <Flip7Card
            key={card.id}
            kind="modifier"
            modifierValue={card.modifierValue}
            label={card.label}
            dealing={dealingIds.includes(card.id)}
            stateAnimation={stateAnimation}
          />
        ))}

        {player.numberCards.map((card) => (
          <Flip7Card
            key={card.id}
            kind="number"
            numberValue={card.numberValue}
            label={card.label}
            dealing={dealingIds.includes(card.id)}
            stateAnimation={stateAnimation}
          />
        ))}

        {player.heldActionCards.map((card) => {
          const key = `${player.playerId}-${card.actionKind}-${card.label}`;
          return (
            <Flip7Card
              key={key}
              kind="action"
              actionKind={card.actionKind}
              label={card.label}
              dealing={dealingIds.includes(key)}
              stateAnimation={stateAnimation}
            />
          );
        })}
      </div>
    </section>
  );
}
