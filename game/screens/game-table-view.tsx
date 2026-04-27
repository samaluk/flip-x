"use client";

import {
  AlertTriangleIcon,
  CircleDotIcon,
  RefreshCwIcon,
  TrophyIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import { formatLatestRoundEventBody } from "@/game/logic/round-event-format";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { PlayerLane } from "@/game/ui/player-lane";
import { RoundHistoryTable } from "@/game/ui/round-history-table";
import { ScoreSummary } from "@/game/ui/score-summary";
import { TurnControls } from "@/game/ui/turn-controls";
import { cn } from "@/shared/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

const listStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
};

export type GameTableViewProps = {
  snapshot: MatchSnapshot;
  isPending?: boolean;
  onHit: () => void;
  onStay: () => void;
  onResolveAction: (targetPlayerId: Id<"players">) => void;
  onStartNextRound: () => void;
  /**
   * Flat card faces (no CSS 3D flip). Use for headless screenshots where preserve-3d is unreliable;
   * Motion is handled separately via MotionGlobalConfig.skipAnimations in browser tests.
   */
  disableCardFlip3d?: boolean;
  /**
   * Disable layout projection on player rows. Headless element screenshots can otherwise include a
   * tall transparent tail (composited white) below real content.
   */
  freezeLaneLayout?: boolean;
};

export function GameTableView({
  snapshot,
  isPending = false,
  onHit,
  onStay,
  onResolveAction,
  onStartNextRound,
  disableCardFlip3d = false,
  freezeLaneLayout = false,
}: GameTableViewProps) {
  const t = useTranslations("GameTable");
  const tEvents = useTranslations("Events");
  const tCards = useTranslations("Cards");
  const tHistory = useTranslations("RoundHistory");

  // Round history opens by default; breakdown opens after round is scored.
  const [expandedSections, setExpandedSections] = useState<string[]>(
    snapshot.roundStatus === "completed" ? ["history", "breakdown"] : ["history"],
  );
  const previousRoundStatus = useRef(snapshot.roundStatus);

  useEffect(() => {
    if (snapshot.roundStatus === "completed" && previousRoundStatus.current !== "completed") {
      setExpandedSections((current) =>
        current.includes("breakdown") ? current : [...current, "breakdown"],
      );
    }
    previousRoundStatus.current = snapshot.roundStatus;
  }, [snapshot.roundStatus]);

  const viewerPlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.viewerPlayerId,
  );
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  const { viewer, opponents } = partitionPlayers(snapshot);

  const latestBody = snapshot.latestEvent
    ? formatLatestRoundEventBody(snapshot.latestEvent, tEvents, tCards)
    : tEvents("noneYet");

  const laneProps: Pick<Parameters<typeof PlayerLane>[0], "disableCardFlip3d"> = {
    disableCardFlip3d,
  };

  const pendingAction = snapshot.pendingAction;
  const viewerIsSource = Boolean(
    pendingAction &&
    snapshot.viewerPlayerId &&
    snapshot.viewerPlayerId === pendingAction.sourcePlayerId,
  );
  const viewerCanTargetSelf = Boolean(
    viewerIsSource &&
    pendingAction &&
    pendingAction.eligibleTargetIds.includes(snapshot.viewerPlayerId ?? ""),
  );

  const renderPlayerLane = (
    player: MatchSnapshot["players"][number],
    options: {
      compact?: boolean;
      overlapCards?: boolean;
    } = {},
  ) => {
    const isTargetable =
      viewerIsSource &&
      !!pendingAction &&
      pendingAction.eligibleTargetIds.includes(player.playerId);
    const isSelfTargeting = !!viewerCanTargetSelf && player.playerId === snapshot.viewerPlayerId;
    const incomingActionKindVal: "flip_three" | "freeze" | null =
      !pendingAction || player.playerId === pendingAction.sourcePlayerId
        ? null
        : pendingAction.eligibleTargetIds.includes(player.playerId)
          ? pendingAction.actionKind
          : null;
    const flip3RemainingVal =
      snapshot.pendingFlip3 && snapshot.pendingFlip3.targetPlayerId === player.playerId
        ? snapshot.pendingFlip3.cardsRemaining
        : null;

    return (
      <PlayerLane
        player={player}
        isActive={snapshot.activePlayerId === player.playerId}
        isViewer={snapshot.viewerPlayerId === player.playerId}
        isDealer={player.seatIndex === snapshot.dealerSeat}
        isActionSource={!!viewerIsSource}
        isTargetable={isTargetable}
        isSelfTargeting={isSelfTargeting}
        incomingActionKind={incomingActionKindVal}
        flip3Remaining={flip3RemainingVal}
        onSelectTarget={
          viewerIsSource
            ? (playerId: string) => onResolveAction(playerId as Id<"players">)
            : undefined
        }
        {...laneProps}
        {...options}
      />
    );
  };

  const callText =
    snapshot.roundStatus === "completed"
      ? t("roundScoredReady")
      : activePlayer
        ? t("playerDeciding", { name: activePlayer.displayName })
        : t("waitingResolution");

  const opponentsGridClass = opponentsGridCols(opponents.length);

  // Mirrors the render conditions inside TurnControls so we can skip the sticky dock
  // (and avoid reserving bottom padding) when no action UI would appear.
  const hasTurnControls =
    snapshot.status !== "completed" &&
    (snapshot.roundStatus === "completed" ||
      snapshot.pendingAction !== null ||
      (activePlayer !== undefined && snapshot.roundStatus === "player_turns"));

  const turnControls = (
    <TurnControls
      snapshot={snapshot}
      onHit={onHit}
      onStay={onStay}
      onResolveAction={onResolveAction}
      onStartNextRound={onStartNextRound}
    />
  );

  return (
    <div className={cn("flex flex-col gap-4", hasTurnControls ? "pb-36 lg:pb-4" : "pb-4")}>
      {/* ─────────── HUD ─────────── */}
      <section
        aria-label={t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
        className="surface-elevated text-foreground overflow-hidden rounded-2xl"
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {snapshot.status === "completed" ? (
              <TrophyIcon className="text-primary size-5 shrink-0" aria-hidden />
            ) : (
              <CircleDotIcon className="text-primary size-5 shrink-0" aria-hidden />
            )}
            <div className="flex min-w-0 flex-col leading-tight">
              <h1 className="font-heading text-foreground truncate text-sm font-medium tracking-tight sm:text-base">
                {t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
              </h1>
              <span className="text-muted-foreground text-xs">
                {t("roundRace", {
                  round: snapshot.currentRoundNumber,
                  target: snapshot.targetScore,
                })}
              </span>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="game-match-status" data-status={snapshot.status}>
              {t(`matchStatus.${snapshot.status}`)}
            </Badge>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {t("dealerSeat", { n: snapshot.dealerSeat + 1 })}
            </Badge>
            {activePlayer ? (
              <Badge variant="default" className="max-w-[12rem]">
                <UserRoundIcon className="size-3" aria-hidden />
                <span className="truncate">{t("turnFor", { name: activePlayer.displayName })}</span>
              </Badge>
            ) : null}
            {isPending ? (
              <Badge variant="secondary" aria-live="polite">
                <RefreshCwIcon className="size-3 animate-spin" aria-hidden />
                <span className="hidden sm:inline">{t("updating")}</span>
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Status + Latest resolution — merged into one compact strip */}
        <div className="border-border grid gap-3 border-t px-4 py-2.5 sm:grid-cols-2 sm:px-5">
          <div className="space-y-0.5">
            <div className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
              {t("tableCall")}
            </div>
            <div className="text-foreground text-sm leading-snug">{callText}</div>
            {viewerPlayer ? (
              <div className="text-muted-foreground text-xs">
                {t("playingAs", { name: viewerPlayer.displayName })}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">{t("joinHint")}</div>
            )}
          </div>
          <div className="border-border space-y-0.5 border-t pt-2.5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wide uppercase">
              <AlertTriangleIcon className="size-3" aria-hidden />
              {t("latestResolution")}
            </div>
            <div className="game-latest-resolution text-foreground text-sm leading-snug">
              {latestBody}
            </div>
            {snapshot.latestEvent?.playerNames ? (
              <div className="text-muted-foreground text-xs">
                {snapshot.latestEvent.playerNames}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─────────── Opponents ─────────── */}
      {opponents.length > 0 ? (
        <section aria-label={t("opponents")} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem] font-medium tracking-wide uppercase">
              <UsersIcon className="size-3.5" aria-hidden />
              <span>{t("opponents")}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="tabular-nums">{opponents.length}</span>
            </div>
          </div>
          {freezeLaneLayout ? (
            <div className={cn("grid gap-3", opponentsGridClass)}>
              {opponents.map((player) => (
                <div key={player.playerId}>{renderPlayerLane(player, { compact: true })}</div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={listStagger}
              initial="hidden"
              animate="show"
              className={cn("grid gap-3", opponentsGridClass)}
            >
              {opponents.map((player) => (
                <motion.div key={player.playerId} variants={listItem}>
                  {renderPlayerLane(player, { compact: true })}
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      ) : null}

      {/* ─────────── Viewer lane ─────────── */}
      {viewer ? (
        <section aria-label={t("yourHand")} className="space-y-2">
          <div className="text-muted-foreground px-1 text-[0.7rem] font-medium tracking-wide uppercase">
            {t("yourHand")}
          </div>
          {renderPlayerLane(viewer)}
        </section>
      ) : null}

      {/* ─────────── Desktop action dock (inline) ─────────── */}
      {hasTurnControls ? (
        <section
          aria-label={t("turnActions")}
          className="surface-elevated hidden rounded-2xl px-4 py-3 lg:block"
        >
          {turnControls}
        </section>
      ) : null}

      {/* ─────────── Round history and breakdown ─────────── */}
      <Card className="w-full">
        <CardContent>
          <Accordion value={expandedSections} onValueChange={setExpandedSections}>
            <AccordionItem value="history">
              <AccordionTrigger className="text-xl">{tHistory("title")}</AccordionTrigger>
              <AccordionContent>
                <RoundHistoryTable history={snapshot.roundHistory} players={snapshot.players} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="breakdown">
              <AccordionTrigger className="text-xl">
                {tHistory("currentRoundBreakdownTitle")}
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pt-2">
                  <p className="text-muted-foreground text-sm">
                    {tHistory("currentRoundBreakdownSubtitle")}
                  </p>
                </div>
                <ScoreSummary players={snapshot.players} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* ─────────── Sticky mobile/tablet action bar ─────────── */}
      {hasTurnControls ? (
        <div
          role="region"
          aria-label={t("turnActions")}
          className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-30 max-h-[55svh] overflow-y-auto border-t px-4 py-3 shadow-[0_-10px_30px_-12px_oklch(0_0_0/0.35)] backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto max-w-5xl">{turnControls}</div>
        </div>
      ) : null}
    </div>
  );
}

/** Viewer first/pinned, opponents in seat order. */
function partitionPlayers(snapshot: MatchSnapshot) {
  const bySeat = [...snapshot.players].toSorted((a, b) => a.seatIndex - b.seatIndex);
  const viewerId = snapshot.viewerPlayerId;
  if (!viewerId) {
    return {
      viewer: null as MatchSnapshot["players"][number] | null,
      opponents: bySeat,
    };
  }
  const viewer = bySeat.find((p) => p.playerId === viewerId) ?? null;
  const opponents = bySeat.filter((p) => p.playerId !== viewerId);
  return { viewer, opponents };
}

/** Opponents grid: density scales with headcount but keeps lanes legible. */
function opponentsGridCols(count: number) {
  if (count <= 1) {
    return "grid-cols-1";
  }
  if (count === 2) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  if (count === 3) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }
  if (count === 4) {
    return "grid-cols-2 lg:grid-cols-4";
  }
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
}
