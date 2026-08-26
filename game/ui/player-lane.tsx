"use client";

import { CrosshairIcon, RefreshCwIcon, UserIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import {
  memo,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FlipXCard } from "@/game/ui/flip-x-card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarBadge, AvatarFallback } from "@/shared/ui/avatar";
import { getPlayerColor, playerInitials } from "@/shared/lib/player-colors";
import {
  arePlayerLanePropsEqual,
  getDisplayStatus,
  type LaneRoundStatus,
  type PlayerLaneProps,
  type SnapshotPlayer,
} from "@/game/ui/player-lane-compare";
import type { ExtractedTranslator } from "@/shared/i18n/extracted-translator";

function formatRoundStatusLabel(status: LaneRoundStatus, t: ExtractedTranslator): string | null {
  switch (status) {
    case "active":
      return null;
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

function poseFromStatus(status: LaneRoundStatus): "bust" | "stay" | null {
  if (status === "busted") {
    return "bust";
  }
  if (status === "stayed" || status === "frozen") {
    return "stay";
  }
  return null;
}

type PlayerLaneSidebarProps = {
  player: SnapshotPlayer;
  compact: boolean;
  displayStatus: LaneRoundStatus;
  isDealer: boolean;
  isViewer: boolean;
  isSelfTargeting: boolean;
  incomingActionKind: "flip_three" | "freeze" | null;
  flip3Remaining: number | null;
};

function PlayerLaneSidebar({
  player,
  compact,
  displayStatus,
  isDealer,
  isViewer,
  isSelfTargeting,
  incomingActionKind,
  flip3Remaining,
}: PlayerLaneSidebarProps) {
  const t = useExtracted("PlayerLane");
  const roundStatusLabel = formatRoundStatusLabel(displayStatus, t);
  const playerColor = getPlayerColor(player.colorId, player.seatIndex);
  const initials = playerInitials(player.displayName);

  return (
    <aside
      className={cn(
        "flex min-w-0 shrink-0 flex-col gap-2.5 rounded-lg border border-border/70 bg-background/35 p-2.5 shadow-sm",
        compact ? "sm:w-30" : "sm:w-39",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar
          size="lg"
          className={cn("shadow-sm ring-2 ring-border/80", compact ? "size-11" : "size-14")}
        >
          <AvatarFallback
            className="text-base font-semibold tracking-tight"
            style={
              {
                backgroundColor: playerColor.background,
                color: playerColor.foreground,
              } satisfies CSSProperties
            }
          >
            {initials}
          </AvatarFallback>
          {player.isOnline ? (
            <AvatarBadge className="border border-background bg-primary ring-background" />
          ) : null}
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

      <div className="flex items-end justify-between gap-2 rounded-md border border-border/55 bg-card/55 px-2 py-1.5">
        <div className="min-w-0 text-xs leading-4 text-muted-foreground">{t("Points at risk")}</div>
        <div className="text-lg leading-5 font-semibold text-foreground tabular-nums">
          {player.pointsAtRisk}
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-1">
        {roundStatusLabel ? (
          <Badge variant={statusVariant(displayStatus)} className="max-w-full text-xs">
            {roundStatusLabel}
          </Badge>
        ) : null}
        {isDealer ? (
          <Badge variant="default" className="text-xs">
            {t("Dealer")}
          </Badge>
        ) : null}
        {isViewer ? (
          <Badge variant="default" className="border-primary/30 bg-primary/15 text-xs text-primary">
            {t("You")}
          </Badge>
        ) : null}
        {player.isOnline && !isViewer ? (
          <Badge variant="secondary" className="text-xs">
            {t("Online")}
          </Badge>
        ) : null}
        {isSelfTargeting ? (
          <Badge variant="outline" className="text-xs">
            <UserIcon className="size-3" />
            {t("Self")}
          </Badge>
        ) : null}
        {incomingActionKind ? (
          <Badge variant="destructive" className="text-xs">
            <CrosshairIcon className="size-3" />
            {t("Incoming")}
          </Badge>
        ) : null}
        {flip3Remaining !== null && flip3Remaining > 0 ? (
          <Badge variant="outline" className="text-xs">
            <RefreshCwIcon className="size-3 animate-spin" />
            {t("{count} to draw", { count: String(flip3Remaining) })}
          </Badge>
        ) : null}
      </div>
    </aside>
  );
}

type PlayerLaneCardStackProps = {
  player: SnapshotPlayer;
  dealingIdSet: ReadonlySet<string>;
  cardStateAnimation: "bust" | "stay" | null;
  compact: boolean;
  disableCardFlip3d: boolean;
  actionSourcePending: boolean;
};

function PlayerLaneCardStack({
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

  return <div className="min-w-0 flex-1 pb-1">{cardRow}</div>;
}

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
  const displayStatus = getDisplayStatus(player);
  const { dealingIdSet, cardStateAnimation } = usePlayerLaneAnimations(player, displayStatus);

  const actionSourcePending = isActionSource;
  const targetingActive = isTargetable || isSelfTargeting;

  const selectTarget = onSelectTarget;
  const canSelectAsTarget = Boolean(selectTarget && targetingActive);
  const targetSelectionProps =
    canSelectAsTarget && selectTarget
      ? {
          role: "button" as const,
          tabIndex: 0 as const,
          "aria-label": t("Select {name} as target", { name: player.displayName }),
          onClick: () => {
            selectTarget(player.playerId);
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectTarget(player.playerId);
            }
          },
        }
      : {};

  return (
    <section
      data-slot="player-lane"
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground transition-shadow duration-300",
        isActive && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        isDealer && "border-primary/30",
        isPinned && "border-primary/30 bg-primary/3",
        compact ? "p-3" : "p-4",
        overlapCards && "relative z-0 focus-within:z-40 hover:z-40",
        (isTargetable || isSelfTargeting) &&
          "cursor-pointer ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
      )}
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
          actionSourcePending={actionSourcePending}
        />
      </div>
    </section>
  );
}, arePlayerLanePropsEqual);

/**
 * Orchestrates the two transient card animations in a lane:
 *
 * - `dealing`: newly added card IDs flash a dealing state for 750ms.
 * - `cardStateAnimation`: a one-shot bust/stay pose on status transitions.
 *
 * Extracted from the `PlayerLane` body so the lane stays focused on rendering
 * and the animation timing can be reasoned about independently.
 */
function usePlayerLaneAnimations(
  player: SnapshotPlayer,
  displayStatus: LaneRoundStatus,
): { dealingIdSet: ReadonlySet<string>; cardStateAnimation: "bust" | "stay" | null } {
  const previousCardIds = useRef<string[]>([]);
  const initialCardSyncDone = useRef(false);
  const previousStatus = useRef(displayStatus);
  const [dealingIds, setDealingIds] = useState<string[]>([]);
  const [stateAnimation, setStateAnimation] = useState<"bust" | "stay" | null>(null);

  // why: previousIds is a Set so the `includes`-style lookup in the diff below
  // stays O(1) instead of O(n²) over the card list.
  const cardIds = useMemo(
    () => [
      ...player.modifierCards.map((card) => card.id),
      ...player.numberCards.map((card) => card.id),
      ...(player.bustCard ? [player.bustCard.id] : []),
      ...player.heldActionCards.map(
        (card) => `${player.playerId}-${card.actionKind}-${card.label}`,
      ),
      ...player.receivedActionCards.map(
        (card) => `${player.playerId}-received-${card.actionKind}-${card.label}`,
      ),
    ],
    [
      player.heldActionCards,
      player.receivedActionCards,
      player.modifierCards,
      player.numberCards,
      player.bustCard,
      player.playerId,
    ],
  );
  const dealingIdSet = useMemo(() => new Set(dealingIds), [dealingIds]);

  useEffect(() => {
    let clear: (() => void) | undefined;
    if (!initialCardSyncDone.current) {
      initialCardSyncDone.current = true;
      previousCardIds.current = cardIds;
    } else {
      const previousIds = new Set(previousCardIds.current);
      const newIds = cardIds.filter((id) => !previousIds.has(id));
      if (newIds.length > 0) {
        setDealingIds(newIds);
        const timeout = window.setTimeout(() => setDealingIds([]), 750);
        previousCardIds.current = cardIds;
        clear = () => {
          window.clearTimeout(timeout);
        };
      } else {
        previousCardIds.current = cardIds;
      }
    }
    return () => {
      clear?.();
    };
  }, [cardIds]);

  // why: transient one-shot bust/stay pose — must trigger synchronously when `displayStatus` transitions (derived from external snapshot, not a local event) and auto-clear after 900ms. Deriving during render would require `setState` in render; deferring to timeout would miss the frame.
  // oxlint-disable react/set-state-in-effect -- intentional status-transition animation; see comment above
  // fallow-ignore-next-line complexity -- transient bust/stay pose animation; same cyclomatic weight as before, now isolated in the hook
  useEffect(() => {
    let clear: (() => void) | undefined;
    if (previousStatus.current !== displayStatus) {
      if (displayStatus === "busted") {
        setStateAnimation("bust");
      } else if (displayStatus === "stayed" || displayStatus === "frozen") {
        setStateAnimation("stay");
      }
      previousStatus.current = displayStatus;
      if (displayStatus === "busted" || displayStatus === "stayed" || displayStatus === "frozen") {
        const timeout = window.setTimeout(() => setStateAnimation(null), 900);
        clear = () => {
          window.clearTimeout(timeout);
        };
      }
    }
    return () => {
      clear?.();
    };
  }, [displayStatus]);
  // oxlint-enable react/set-state-in-effect

  return { dealingIdSet, cardStateAnimation: stateAnimation ?? poseFromStatus(displayStatus) };
}
