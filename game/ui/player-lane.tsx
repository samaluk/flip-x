"use client";

import { useTranslations } from "next-intl";
import { memo, type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { Flip7Card } from "@/game/ui/flip7-card";
import { Badge } from "@/shared/ui/badge";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { cn } from "@/shared/lib/utils";

function statusLabelKey(status: MatchSnapshot["players"][number]["roundStatus"]): string | null {
  switch (status) {
    case "active":
      return null;
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

function poseFromStatus(
  status: MatchSnapshot["players"][number]["roundStatus"],
): "bust" | "stay" | null {
  if (status === "busted") {
    return "bust";
  }
  if (status === "stayed" || status === "frozen") {
    return "stay";
  }
  return null;
}

type PlayerLaneProps = {
  player: MatchSnapshot["players"][number];
  isActive: boolean;
  isDealer?: boolean;
  isViewer?: boolean;
  isPinned?: boolean;
  compact?: boolean;
  /** No CSS 3D flip (reliable faces in headless screenshots). */
  disableCardFlip3d?: boolean;
  /** Overlap cards horizontally; fan out on lane hover (round table opponents). */
  overlapCards?: boolean;
};

export const PlayerLane = memo(function PlayerLane({
  player,
  isActive,
  isDealer = false,
  isViewer = false,
  isPinned = false,
  compact = false,
  disableCardFlip3d = false,
  overlapCards = false,
}: PlayerLaneProps) {
  const t = useTranslations("PlayerLane");
  const previousCardIds = useRef<string[]>([]);
  const initialCardSyncDone = useRef(false);
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
  const dealingIdSet = useMemo(() => new Set(dealingIds), [dealingIds]);

  useEffect(() => {
    if (!initialCardSyncDone.current) {
      initialCardSyncDone.current = true;
      previousCardIds.current = cardIds;
      return;
    }

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

  const cardStateAnimation = stateAnimation ?? poseFromStatus(player.roundStatus);
  const roundStatusLabelKey = statusLabelKey(player.roundStatus);

  const cardElements: ReactElement[] = [
    ...player.modifierCards.map((card) => (
      <Flip7Card
        key={card.id}
        kind="modifier"
        modifierValue={card.modifierValue}
        label={card.label}
        dealing={dealingIdSet.has(card.id)}
        stateAnimation={cardStateAnimation}
        compact={compact}
        disableFlip3d={disableCardFlip3d}
      />
    )),
    ...player.numberCards.map((card) => (
      <Flip7Card
        key={card.id}
        kind="number"
        numberValue={card.numberValue}
        label={card.label}
        dealing={dealingIdSet.has(card.id)}
        stateAnimation={cardStateAnimation}
        compact={compact}
        disableFlip3d={disableCardFlip3d}
      />
    )),
    ...player.heldActionCards.map((card) => {
      const key = `${player.playerId}-${card.actionKind}-${card.label}`;
      return (
        <Flip7Card
          key={key}
          kind="action"
          actionKind={card.actionKind}
          label={card.label}
          dealing={dealingIdSet.has(key)}
          stateAnimation={cardStateAnimation}
          compact={compact}
          disableFlip3d={disableCardFlip3d}
        />
      );
    }),
  ];

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground transition-shadow duration-300",
        isActive && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        isDealer && "border-primary/30",
        isPinned && "border-primary/30 bg-primary/[0.03]",
        compact ? "p-3" : "p-4",
        overlapCards && "relative z-0 hover:z-40 focus-within:z-40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-foreground text-base font-medium tracking-tight">
              {player.displayName}
            </h3>
            {isDealer ? (
              <Badge variant="default" className="text-[0.65rem]">
                {t("dealer")}
              </Badge>
            ) : null}
            {isViewer ? (
              <Badge
                variant="default"
                className="bg-primary/15 text-primary border-primary/30 text-[0.65rem]"
              >
                {t("you")}
              </Badge>
            ) : null}
            {player.isOnline && !isViewer ? (
              <Badge variant="secondary" className="text-[0.65rem]">
                {t("online")}
              </Badge>
            ) : null}
          </div>
          <div className="text-muted-foreground text-sm">
            {t("totalScore", { score: player.totalScore })}
          </div>
        </div>

        {!compact && (
          <div className="grid min-w-[9rem] gap-0.5 text-right text-sm">
            {roundStatusLabelKey ? (
              <Badge
                variant={statusVariant(player.roundStatus)}
                className="justify-end text-[0.65rem]"
              >
                {t(roundStatusLabelKey)}
              </Badge>
            ) : null}
            <div className="text-foreground text-2xl font-semibold tabular-nums">
              {player.pointsAtRisk}
            </div>
            <div className="text-muted-foreground text-xs">{t("pointsAtRisk")}</div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-3 flex flex-row items-start",
          overlapCards
            ? "group/cards max-w-[min(100%,26rem)] flex-nowrap overflow-x-auto overscroll-x-contain pb-1 [&>*]:transition-[margin-left] [&>*]:duration-300 [&>*]:ease-out [&>*:not(:first-child)]:-ml-7 sm:[&>*:not(:first-child)]:-ml-8 group-hover/cards:[&>*]:ml-0"
            : compact
              ? "flex-wrap gap-1.5"
              : "flex-wrap gap-3",
        )}
      >
        {overlapCards
          ? cardElements.map((el, index) => {
              const wrapKey = String(el.key ?? index);
              return (
                <div key={wrapKey} className="shrink-0" style={{ zIndex: index + 1 }}>
                  {el}
                </div>
              );
            })
          : cardElements}
      </div>
    </section>
  );
}, arePlayerLanePropsEqual);

function arePlayerLanePropsEqual(left: PlayerLaneProps, right: PlayerLaneProps) {
  return (
    left.isActive === right.isActive &&
    left.isDealer === right.isDealer &&
    left.isViewer === right.isViewer &&
    left.isPinned === right.isPinned &&
    left.compact === right.compact &&
    left.disableCardFlip3d === right.disableCardFlip3d &&
    left.overlapCards === right.overlapCards &&
    arePlayersEqual(left.player, right.player)
  );
}

function arePlayersEqual(
  left: MatchSnapshot["players"][number],
  right: MatchSnapshot["players"][number],
) {
  return (
    left.playerId === right.playerId &&
    left.displayName === right.displayName &&
    left.seatIndex === right.seatIndex &&
    left.totalScore === right.totalScore &&
    left.isOnline === right.isOnline &&
    left.roundStatus === right.roundStatus &&
    left.pointsAtRisk === right.pointsAtRisk &&
    areNumberCardsEqual(left.numberCards, right.numberCards) &&
    areModifierCardsEqual(left.modifierCards, right.modifierCards) &&
    areHeldActionCardsEqual(left.heldActionCards, right.heldActionCards)
  );
}

function areNumberCardsEqual(
  left: MatchSnapshot["players"][number]["numberCards"],
  right: MatchSnapshot["players"][number]["numberCards"],
) {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i++) {
    if (
      left[i]?.id !== right[i]?.id ||
      left[i]?.label !== right[i]?.label ||
      left[i]?.numberValue !== right[i]?.numberValue
    ) {
      return false;
    }
  }

  return true;
}

function areModifierCardsEqual(
  left: MatchSnapshot["players"][number]["modifierCards"],
  right: MatchSnapshot["players"][number]["modifierCards"],
) {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i++) {
    if (
      left[i]?.id !== right[i]?.id ||
      left[i]?.label !== right[i]?.label ||
      left[i]?.modifierValue !== right[i]?.modifierValue
    ) {
      return false;
    }
  }

  return true;
}

function areHeldActionCardsEqual(
  left: MatchSnapshot["players"][number]["heldActionCards"],
  right: MatchSnapshot["players"][number]["heldActionCards"],
) {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i++) {
    if (left[i]?.label !== right[i]?.label || left[i]?.actionKind !== right[i]?.actionKind) {
      return false;
    }
  }

  return true;
}
