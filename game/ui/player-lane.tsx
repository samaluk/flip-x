"use client";

import { useExtracted } from "next-intl";
import { memo, type KeyboardEvent } from "react";

import { cn } from "@/shared/lib/utils";
import { arePlayerLanePropsEqual, type PlayerLaneProps } from "@/game/ui/player-lane-compare";
import { usePlayerLaneAnimations } from "@/game/ui/player-lane-animations";
import { getLaneStatus } from "@/game/ui/player-lane-status";
import { PlayerLaneSidebar, PlayerLaneCardStack } from "@/game/ui/player-lane-sections";

// why: these are independent orthogonal lane states (active ring, dealer
// border, viewer badge, target ring, overlap hover), not mutually-exclusive
// variants — a lane can be active + dealer + viewer + targetable at once —
// so the rule's discriminated-variant fix does not apply here.
// react-doctor-disable-next-line react-doctor/no-many-boolean-props
export const PlayerLane = memo(function PlayerLane({
  player,
  isActive,
  isDealer = false,
  isViewer = false,
  isPinned = false,
  compact = false,
  disableCardFlip3d = false,
  overlapCards = false,
  isActionSource = false,
  isTargetable = false,
  isSelfTargeting = false,
  incomingActionKind = null,
  flip3Remaining = null,
  onSelectTarget,
}: PlayerLaneProps) {
  const t = useExtracted("PlayerLane");
  const displayStatus = getLaneStatus(player);
  const { dealingIdSet, cardStateAnimation } = usePlayerLaneAnimations(player, displayStatus);

  const targetSelectionProps = getTargetSelectionProps(
    player.playerId,
    t("Select {name} as target", { name: player.displayName }),
    isTargetable || isSelfTargeting,
    onSelectTarget,
  );

  return (
    <section
      data-slot="player-lane"
      className={laneClassName({
        isActive,
        isDealer,
        isPinned,
        compact,
        overlapCards,
        isTargetable,
        isSelfTargeting,
      })}
      {...targetSelectionProps}
    >
      <div
        className={cn(
          "flex flex-col items-start gap-3 sm:flex-row",
          compact ? "sm:items-stretch" : "sm:items-start",
        )}
      >
        <PlayerLaneSidebar
          player={player}
          compact={compact}
          displayStatus={displayStatus}
          isDealer={isDealer}
          isViewer={isViewer}
          isSelfTargeting={isSelfTargeting}
          incomingActionKind={incomingActionKind}
          flip3Remaining={flip3Remaining}
        />
        <PlayerLaneCardStack
          player={player}
          dealingIdSet={dealingIdSet}
          cardStateAnimation={cardStateAnimation}
          compact={compact}
          disableCardFlip3d={disableCardFlip3d}
          actionSourcePending={isActionSource}
        />
      </div>
    </section>
  );
}, arePlayerLanePropsEqual);

function getTargetSelectionProps(
  playerId: PlayerLaneProps["player"]["playerId"],
  label: string,
  targetingActive: boolean,
  onSelectTarget: PlayerLaneProps["onSelectTarget"],
) {
  if (!targetingActive || !onSelectTarget) return {};
  return {
    role: "button" as const,
    tabIndex: 0 as const,
    "aria-label": label,
    onClick: () => onSelectTarget(playerId),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelectTarget(playerId);
      }
    },
  };
}

function laneClassName({
  isActive,
  isDealer,
  isPinned,
  compact,
  overlapCards,
  isTargetable,
  isSelfTargeting,
}: Pick<
  PlayerLaneProps,
  | "isActive"
  | "isDealer"
  | "isPinned"
  | "compact"
  | "overlapCards"
  | "isTargetable"
  | "isSelfTargeting"
>) {
  return cn(
    "rounded-xl border border-border bg-card text-card-foreground transition-shadow duration-300",
    isActive && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
    isDealer && "border-primary/30",
    isPinned && "border-primary/30 bg-primary/3",
    compact ? "p-3" : "p-4",
    overlapCards && "relative z-0 focus-within:z-40 hover:z-40",
    (isTargetable || isSelfTargeting) &&
      "cursor-pointer ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
  );
}
