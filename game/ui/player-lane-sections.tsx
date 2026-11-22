"use client";

import { CrosshairIcon, RefreshCwIcon, UserIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { type ReactElement, useMemo } from "react";

import { FlipXCard } from "@/game/ui/flip-x-card";
import type { LaneRoundStatus, SnapshotPlayer } from "@/game/ui/player-lane-compare";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarBadge, AvatarFallback } from "@/shared/ui/avatar";
import { getPlayerColor, playerInitials } from "@/shared/lib/player-colors";

function statusVariant(status: LaneRoundStatus) {
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

export type PlayerLaneSidebarProps = {
  player: SnapshotPlayer;
  compact: boolean;
  displayStatus: LaneRoundStatus;
  isDealer: boolean;
  isViewer: boolean;
  isSelfTargeting: boolean;
  incomingActionKind: "flip_three" | "freeze" | null;
  flip3Remaining: number | null;
};

function useRoundStatusLabel(displayStatus: LaneRoundStatus): string | null {
  const t = useExtracted("PlayerLane");
  if (displayStatus === "active") {
    return null;
  }

  switch (displayStatus) {
    case "busted":
      return t("Busted");
    case "stayed":
      return t("Banked");
    case "frozen":
      return t("Frozen");
    case "completed":
      return t("Scored");
    default:
      return t("Waiting");
  }
}

// why: badge visibility is independent orthogonal lane state, not a discriminated variant.
// react-doctor-disable-next-line react-doctor/no-many-boolean-props
function PlayerLaneBadges({
  roundStatusLabel,
  displayStatus,
  isDealer,
  isViewer,
  isSelfTargeting,
  incomingActionKind,
  flip3Remaining,
  isOnline,
}: {
  roundStatusLabel: string | null;
  displayStatus: LaneRoundStatus;
  isDealer: boolean;
  isViewer: boolean;
  isSelfTargeting: boolean;
  incomingActionKind: "flip_three" | "freeze" | null;
  flip3Remaining: number | null;
  isOnline: boolean;
}) {
  const t = useExtracted("PlayerLane");

  return (
    <div className="flex w-full flex-wrap gap-1">
      {roundStatusLabel ? (
        <Badge variant={statusVariant(displayStatus)} className="max-w-full">
          {roundStatusLabel}
        </Badge>
      ) : null}
      {isDealer ? <Badge variant="default">{t("Dealer")}</Badge> : null}
      {isViewer ? <Badge variant="soft">{t("You")}</Badge> : null}
      {isOnline && !isViewer ? <Badge variant="secondary">{t("Online")}</Badge> : null}
      <PlayerLaneActionBadges
        isSelfTargeting={isSelfTargeting}
        incomingActionKind={incomingActionKind}
        flip3Remaining={flip3Remaining}
      />
    </div>
  );
}

function PlayerLaneActionBadges({
  isSelfTargeting,
  incomingActionKind,
  flip3Remaining,
}: {
  isSelfTargeting: boolean;
  incomingActionKind: "flip_three" | "freeze" | null;
  flip3Remaining: number | null;
}) {
  const t = useExtracted("PlayerLane");
  return (
    <>
      {isSelfTargeting ? (
        <Badge variant="outline">
          <UserIcon className="size-3" />
          {t("Self")}
        </Badge>
      ) : null}
      {incomingActionKind ? (
        <Badge variant="destructive">
          <CrosshairIcon className="size-3" />
          {t("Incoming")}
        </Badge>
      ) : null}
      {flip3Remaining !== null && flip3Remaining > 0 ? (
        <Badge variant="outline">
          <RefreshCwIcon className="size-3 animate-spin" />
          {t("{count} to draw", { count: String(flip3Remaining) })}
        </Badge>
      ) : null}
    </>
  );
}

function PlayerIdentity({ player, compact }: { player: SnapshotPlayer; compact: boolean }) {
  const t = useExtracted("PlayerLane");
  const playerColor = getPlayerColor(player.colorId, player.seatIndex);
  const initials = playerInitials(player.displayName);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar size="lg" className={compact ? "size-11" : "size-14"}>
        {/* Theme swatch tokens are selected from a closed PlayerColorId map. */}
        {/* oxlint-disable-next-line shadcn/require-static-classes */}
        <AvatarFallback className={playerColor.swatchClass}>{initials}</AvatarFallback>
        {player.isOnline ? <AvatarBadge /> : null}
      </Avatar>

      <div className="min-w-0 flex-1 text-start">
        <h3 className="truncate font-heading text-sm leading-5 font-medium tracking-tight text-foreground">
          {player.displayName}
        </h3>
        <div className="truncate text-xs leading-4 text-muted-foreground tabular-nums">
          {t("Total score {score}", { score: String(player.totalScore) })}
        </div>
      </div>
    </div>
  );
}

function PointsAtRisk({ pointsAtRisk }: { pointsAtRisk: number }) {
  const t = useExtracted("PlayerLane");

  return (
    <div className="flex items-end justify-between gap-2 rounded-md border border-border/55 bg-card/55 px-2 py-1.5">
      <div className="min-w-0 text-xs leading-4 text-muted-foreground">{t("Points at risk")}</div>
      <div className="text-lg leading-5 font-semibold text-foreground tabular-nums">
        {pointsAtRisk}
      </div>
    </div>
  );
}

export function PlayerLaneSidebar({
  player,
  compact,
  displayStatus,
  isDealer,
  isViewer,
  isSelfTargeting,
  incomingActionKind,
  flip3Remaining,
}: PlayerLaneSidebarProps) {
  const roundStatusLabel = useRoundStatusLabel(displayStatus);

  return (
    <aside
      className={cn(
        "flex min-w-0 shrink-0 flex-col gap-2.5 rounded-lg border border-border/70 bg-background/35 p-2.5 shadow-sm",
        compact ? "sm:w-30" : "sm:w-39",
      )}
    >
      <PlayerIdentity player={player} compact={compact} />
      <PointsAtRisk pointsAtRisk={player.pointsAtRisk} />
      <PlayerLaneBadges
        roundStatusLabel={roundStatusLabel}
        displayStatus={displayStatus}
        isDealer={isDealer}
        isViewer={isViewer}
        isSelfTargeting={isSelfTargeting}
        incomingActionKind={incomingActionKind}
        flip3Remaining={flip3Remaining}
        isOnline={player.isOnline}
      />
    </aside>
  );
}

export type PlayerLaneCardStackProps = {
  player: SnapshotPlayer;
  dealingIdSet: ReadonlySet<string>;
  cardStateAnimation: "bust" | "stay" | null;
  compact: boolean;
  disableCardFlip3d: boolean;
  actionSourcePending: boolean;
};

export function PlayerLaneCardStack({
  player,
  dealingIdSet,
  cardStateAnimation,
  compact,
  disableCardFlip3d,
  actionSourcePending,
}: PlayerLaneCardStackProps) {
  const cardElements = useMemo<ReactElement[]>(
    () => [
      ...player.modifierCards.map((card) => (
        <FlipXCard
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
        <FlipXCard
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
      ...(player.bustCard
        ? [
            <FlipXCard
              key={player.bustCard.id}
              kind="number"
              numberValue={player.bustCard.numberValue}
              label={player.bustCard.label}
              dealing={dealingIdSet.has(player.bustCard.id)}
              stateAnimation={cardStateAnimation}
              compact={compact}
              disableFlip3d={disableCardFlip3d}
            />,
          ]
        : []),
      ...player.heldActionCards.map((card) => {
        const key = `${player.playerId}-${card.actionKind}-${card.label}`;
        return (
          <FlipXCard
            key={key}
            kind="action"
            actionKind={card.actionKind}
            label={card.label}
            dealing={dealingIdSet.has(key)}
            stateAnimation={cardStateAnimation}
            compact={compact}
            disableFlip3d={disableCardFlip3d}
            active={actionSourcePending}
          />
        );
      }),
      ...player.receivedActionCards.map((card) => {
        const key = `${player.playerId}-received-${card.actionKind}-${card.label}`;
        return (
          <FlipXCard
            key={key}
            kind="action"
            actionKind={card.actionKind}
            label={card.label}
            stateAnimation={cardStateAnimation}
            compact={compact}
            disableFlip3d={disableCardFlip3d}
            variant="received"
          />
        );
      }),
    ],
    [
      actionSourcePending,
      cardStateAnimation,
      compact,
      dealingIdSet,
      disableCardFlip3d,
      player.bustCard,
      player.heldActionCards,
      player.modifierCards,
      player.numberCards,
      player.playerId,
      player.receivedActionCards,
    ],
  );

  const cardRow = (
    <div
      className={cn(
        "flex min-w-0 flex-wrap content-start items-start",
        compact ? "gap-1.5" : "gap-2.5 sm:gap-3",
      )}
    >
      {cardElements.length > 0 ? cardElements : null}
    </div>
  );

  return <div className="min-w-0 flex-1 pbe-1">{cardRow}</div>;
}
