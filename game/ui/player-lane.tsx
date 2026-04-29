"use client";

import { CrosshairIcon, RefreshCwIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  memo,
  type CSSProperties,
  type ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Flip7Card } from "@/game/ui/flip7-card";
import { Badge } from "@/shared/ui/badge";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { getPlayerColor, playerInitials } from "@/shared/lib/player-colors";

type LaneRoundStatus = MatchSnapshot["players"][number]["roundStatus"];

function getDisplayStatus(
  player: MatchSnapshot["players"][number],
): LaneRoundStatus {
  if (player.bustCard !== null) {
    return "busted";
  }
  return player.roundStatus;
}

function statusLabelKey(status: LaneRoundStatus): string | null {
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
  /** Player is the source of pending action (needs to pick target) */
  isActionSource?: boolean;
  /** This player lane is an eligible target */
  isTargetable?: boolean;
  /** Viewer can target themselves */
  isSelfTargeting?: boolean;
  /** Action being targeted at this player */
  incomingActionKind?: "flip_three" | "freeze" | null;
  /** Flip 3 cards remaining to draw */
  flip3Remaining?: number | null;
  /** Callback when player is clicked as target */
  onSelectTarget?: (playerId: string) => void;
};

type PlayerLaneSidebarProps = {
  player: MatchSnapshot["players"][number];
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
  const t = useTranslations("PlayerLane");
  const roundStatusLabelKey = statusLabelKey(displayStatus);
  const playerColor = getPlayerColor(player.colorId, player.seatIndex);
  const initials = playerInitials(player.displayName);

  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-2", compact ? "w-24" : "w-32")}>
      <Avatar size="lg" className={cn("ring-2 ring-border", compact ? "size-11" : "size-14")}>
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
      </Avatar>

      <div className="flex w-full min-w-0 flex-col items-center gap-0.5 text-center">
        <h3 className="font-heading text-foreground w-full truncate text-sm font-medium tracking-tight">
          {player.displayName}
        </h3>
        <div className="text-muted-foreground text-xs tabular-nums">
          {t("totalScore", { score: player.totalScore })}
        </div>
        <div className="text-foreground text-lg font-semibold tabular-nums">{player.pointsAtRisk}</div>
        <div className="text-muted-foreground text-[0.65rem] leading-none">{t("pointsAtRisk")}</div>
      </div>

      <div className="flex w-full flex-col items-center gap-1">
        {roundStatusLabelKey ? (
          <Badge variant={statusVariant(displayStatus)} className="max-w-full text-[0.65rem]">
            {t(roundStatusLabelKey)}
          </Badge>
        ) : null}
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
        {isSelfTargeting ? (
          <Badge variant="outline" className="text-[0.65rem]">
            <UserIcon className="size-3" />
            {t("selfTarget")}
          </Badge>
        ) : null}
        {incomingActionKind ? (
          <Badge variant="destructive" className="text-[0.65rem]">
            <CrosshairIcon className="size-3" />
            {t("incomingAction")}
          </Badge>
        ) : null}
        {flip3Remaining !== null && flip3Remaining > 0 ? (
          <Badge variant="outline" className="text-[0.65rem]">
            <RefreshCwIcon className="size-3 animate-spin" />
            {t("flip3Remaining", { count: flip3Remaining })}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

type PlayerLaneCardStackProps = {
  player: MatchSnapshot["players"][number];
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
  const cardElements = useMemo(
    () =>
      [
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
        ...(player.bustCard
          ? [
              <Flip7Card
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
            <Flip7Card
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
            <Flip7Card
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
      ] as ReactElement[],
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

  return (
    <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1">
      <div className={cn("flex flex-nowrap items-start", compact ? "gap-1.5" : "gap-3")}>
        {cardElements.length > 0 ? cardElements : null}
      </div>
    </div>
  );
}

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
  const previousCardIds = useRef<string[]>([]);
  const initialCardSyncDone = useRef(false);
  const displayStatus = getDisplayStatus(player);
  const previousStatus = useRef(displayStatus);
  const [dealingIds, setDealingIds] = useState<string[]>([]);
  const [stateAnimation, setStateAnimation] = useState<"bust" | "stay" | null>(null);

  const actionSourcePending = isActionSource;
  const targetingActive = isTargetable || isSelfTargeting;

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
    if (previousStatus.current === displayStatus) {
      return;
    }

    if (displayStatus === "busted") {
      setStateAnimation("bust");
    } else if (displayStatus === "stayed" || displayStatus === "frozen") {
      setStateAnimation("stay");
    }

    previousStatus.current = displayStatus;

    if (
      displayStatus === "busted" ||
      displayStatus === "stayed" ||
      displayStatus === "frozen"
    ) {
      const timeout = window.setTimeout(() => setStateAnimation(null), 900);
      return () => window.clearTimeout(timeout);
    }
  }, [displayStatus]);

  const cardStateAnimation = stateAnimation ?? poseFromStatus(displayStatus);

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground transition-shadow duration-300",
        isActive && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        isDealer && "border-primary/30",
        isPinned && "border-primary/30 bg-primary/[0.03]",
        compact ? "p-3" : "p-4",
        overlapCards && "relative z-0 hover:z-40 focus-within:z-40",
        (isTargetable || isSelfTargeting) &&
          "ring-2 ring-yellow-500/70 ring-offset-2 ring-offset-background cursor-pointer",
      )}
      onClick={() => {
        if (onSelectTarget && (isTargetable || isSelfTargeting)) {
          onSelectTarget(player.playerId);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" && onSelectTarget && (isTargetable || isSelfTargeting)) {
          onSelectTarget(player.playerId);
        }
      }}
      role={targetingActive ? "button" : undefined}
      tabIndex={targetingActive ? 0 : undefined}
      aria-label={targetingActive ? `Select ${player.displayName} as target` : undefined}
    >
      <div className="flex items-stretch gap-4">
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

const PLAYER_LANE_MEMO_SCALAR_KEYS = [
  "isActive",
  "isDealer",
  "isViewer",
  "isPinned",
  "compact",
  "disableCardFlip3d",
  "overlapCards",
  "isActionSource",
  "isTargetable",
  "isSelfTargeting",
  "incomingActionKind",
  "flip3Remaining",
] as const satisfies readonly (keyof PlayerLaneProps)[];

function arePlayerLanePropsEqual(left: PlayerLaneProps, right: PlayerLaneProps) {
  for (const key of PLAYER_LANE_MEMO_SCALAR_KEYS) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  if (Boolean(left.onSelectTarget) !== Boolean(right.onSelectTarget)) {
    return false;
  }
  return arePlayersEqual(left.player, right.player);
}

type SnapshotPlayer = MatchSnapshot["players"][number];

function arePlayerSnapshotScalarsEqual(left: SnapshotPlayer, right: SnapshotPlayer) {
  return (
    left.playerId === right.playerId &&
    left.displayName === right.displayName &&
    left.colorId === right.colorId &&
    left.seatIndex === right.seatIndex &&
    left.totalScore === right.totalScore &&
    left.isOnline === right.isOnline &&
    left.roundStatus === right.roundStatus &&
    left.pointsAtRisk === right.pointsAtRisk
  );
}

function arePlayerSnapshotCardsEqual(left: SnapshotPlayer, right: SnapshotPlayer) {
  return (
    areNumberCardsEqual(left.numberCards, right.numberCards) &&
    areNumberCardEqual(left.bustCard, right.bustCard) &&
    areModifierCardsEqual(left.modifierCards, right.modifierCards) &&
    areActionCardsEqual(left.heldActionCards, right.heldActionCards) &&
    areActionCardsEqual(left.receivedActionCards, right.receivedActionCards)
  );
}

function arePlayersEqual(left: SnapshotPlayer, right: SnapshotPlayer) {
  return arePlayerSnapshotScalarsEqual(left, right) && arePlayerSnapshotCardsEqual(left, right);
}

function areNumberCardEqual(
  left: MatchSnapshot["players"][number]["bustCard"],
  right: MatchSnapshot["players"][number]["bustCard"],
) {
  return (
    left?.id === right?.id &&
    left?.label === right?.label &&
    left?.numberValue === right?.numberValue
  );
}

function areParallelSnapshotCardsEqual<A, B>(
  left: readonly A[],
  right: readonly B[],
  sameAtIndex: (a: A | undefined, b: B | undefined) => boolean,
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i++) {
    if (!sameAtIndex(left[i], right[i])) {
      return false;
    }
  }
  return true;
}

function areNumberCardsEqual(
  left: MatchSnapshot["players"][number]["numberCards"],
  right: MatchSnapshot["players"][number]["numberCards"],
) {
  return areParallelSnapshotCardsEqual(left, right, (a, b) =>
    Boolean(
      a &&
        b &&
        a.id === b.id &&
        a.label === b.label &&
        a.numberValue === b.numberValue,
    ),
  );
}

function areModifierCardsEqual(
  left: MatchSnapshot["players"][number]["modifierCards"],
  right: MatchSnapshot["players"][number]["modifierCards"],
) {
  return areParallelSnapshotCardsEqual(left, right, (a, b) =>
    Boolean(
      a &&
        b &&
        a.id === b.id &&
        a.label === b.label &&
        a.modifierValue === b.modifierValue,
    ),
  );
}

function areActionCardsEqual(
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
