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

type GameTableViewProps = {
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

  const callText = callTextForSnapshot(snapshot, activePlayer, t);

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
      <GameTableHud
        snapshot={snapshot}
        t={t}
        isPending={isPending}
        callText={callText}
        latestBody={latestBody}
        activePlayer={activePlayer}
        viewerPlayer={viewerPlayer}
      />

      <GameTableOpponentsSection
        opponents={opponents}
        opponentsGridClass={opponentsGridClass}
        freezeLaneLayout={freezeLaneLayout}
        t={t}
        snapshot={snapshot}
        viewerIsSource={viewerIsSource}
        viewerCanTargetSelf={viewerCanTargetSelf}
        onResolveAction={onResolveAction}
        disableCardFlip3d={disableCardFlip3d}
      />

      {viewer ? (
        <section aria-label={t("yourHand")} className="space-y-2">
          <div className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("yourHand")}
          </div>
          <MatchPlayerLane
            snapshot={snapshot}
            player={viewer}
            viewerIsSource={viewerIsSource}
            viewerCanTargetSelf={viewerCanTargetSelf}
            onResolveAction={onResolveAction}
            disableCardFlip3d={disableCardFlip3d}
          />
        </section>
      ) : null}

      {hasTurnControls ? (
        <section
          aria-label={t("turnActions")}
          className="surface-elevated hidden rounded-2xl px-4 py-3 lg:block"
        >
          {turnControls}
        </section>
      ) : null}

      <RoundHistorySection
        expandedSections={expandedSections}
        onExpandedChange={setExpandedSections}
        snapshot={snapshot}
        tHistory={tHistory}
      />

      {hasTurnControls ? (
        <div
          role="region"
          aria-label={t("turnActions")}
          className="fixed inset-x-0 bottom-0 z-30 max-h-svh overflow-y-auto border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto max-w-5xl">{turnControls}</div>
        </div>
      ) : null}
    </div>
  );
}

type GameTableHudProps = {
  snapshot: MatchSnapshot;
  t: ReturnType<typeof useTranslations<"GameTable">>;
  isPending: boolean;
  callText: string;
  latestBody: string;
  activePlayer: MatchSnapshot["players"][number] | undefined;
  viewerPlayer: MatchSnapshot["players"][number] | undefined;
};

function GameTableHud({
  snapshot,
  t,
  isPending,
  callText,
  latestBody,
  activePlayer,
  viewerPlayer,
}: GameTableHudProps) {
  const matchComplete = snapshot.status === "completed";

  return (
    <section
      aria-label={t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
      className="surface-elevated overflow-hidden rounded-2xl text-foreground"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {matchComplete ? (
            <TrophyIcon className="size-5 shrink-0 text-primary" aria-hidden />
          ) : (
            <CircleDotIcon className="size-5 shrink-0 text-primary" aria-hidden />
          )}
          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="truncate font-heading text-sm font-medium tracking-tight text-foreground sm:text-base">
              {t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
            </h1>
            <span className="text-xs text-muted-foreground">
              {t("roundRace", {
                round: snapshot.currentRoundNumber,
                target: snapshot.targetScore,
              })}
            </span>
          </div>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" data-slot="match-status" data-status={snapshot.status}>
            {t(`matchStatus.${snapshot.status}`)}
          </Badge>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {t("dealerSeat", { n: snapshot.dealerSeat + 1 })}
          </Badge>
          {activePlayer ? (
            <Badge variant="default" className="max-w-48">
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

      <div className="grid gap-3 border-t border-border px-4 py-2.5 sm:grid-cols-2 sm:px-5">
        <div className="space-y-0.5">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("tableCall")}
          </div>
          <div className="text-sm leading-snug text-foreground">{callText}</div>
          {viewerPlayer ? (
            <div className="text-xs text-muted-foreground">
              {t("playingAs", { name: viewerPlayer.displayName })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">{t("joinHint")}</div>
          )}
        </div>
        <div className="space-y-0.5 border-t border-border pt-2.5 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
          <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <AlertTriangleIcon className="size-3" aria-hidden />
            {t("latestResolution")}
          </div>
          <div data-slot="game-latest-resolution" className="text-sm leading-snug text-foreground">
            {latestBody}
          </div>
          {snapshot.latestEvent?.playerNames ? (
            <div className="text-xs text-muted-foreground">{snapshot.latestEvent.playerNames}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type GameTableOpponentsSectionProps = {
  opponents: MatchSnapshot["players"];
  opponentsGridClass: string;
  freezeLaneLayout: boolean;
  t: ReturnType<typeof useTranslations<"GameTable">>;
  snapshot: MatchSnapshot;
  viewerIsSource: boolean;
  viewerCanTargetSelf: boolean;
  onResolveAction: (targetPlayerId: Id<"players">) => void;
  disableCardFlip3d: boolean;
};

function GameTableOpponentsSection({
  opponents,
  opponentsGridClass,
  freezeLaneLayout,
  t,
  snapshot,
  viewerIsSource,
  viewerCanTargetSelf,
  onResolveAction,
  disableCardFlip3d,
}: GameTableOpponentsSectionProps) {
  if (opponents.length === 0) {
    return null;
  }

  const gridClass = cn("grid gap-3", opponentsGridClass);

  const laneFor = (player: MatchSnapshot["players"][number]) => (
    <MatchPlayerLane
      snapshot={snapshot}
      player={player}
      viewerIsSource={viewerIsSource}
      viewerCanTargetSelf={viewerCanTargetSelf}
      onResolveAction={onResolveAction}
      disableCardFlip3d={disableCardFlip3d}
      compact
    />
  );

  return (
    <section aria-label={t("opponents")} className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <UsersIcon className="size-3.5" aria-hidden />
          <span>{t("opponents")}</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="tabular-nums">{opponents.length}</span>
        </div>
      </div>
      {freezeLaneLayout ? (
        <div className={gridClass}>
          {opponents.map((player) => (
            <div key={player.playerId}>{laneFor(player)}</div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={listStagger}
          initial="hidden"
          animate="show"
          className={gridClass}
        >
          {opponents.map((player) => (
            <motion.div key={player.playerId} variants={listItem}>
              {laneFor(player)}
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

type MatchPlayerLaneProps = {
  snapshot: MatchSnapshot;
  player: MatchSnapshot["players"][number];
  viewerIsSource: boolean;
  viewerCanTargetSelf: boolean;
  onResolveAction: (targetPlayerId: Id<"players">) => void;
  disableCardFlip3d: boolean;
  compact?: boolean;
  overlapCards?: boolean;
};

function MatchPlayerLane({
  snapshot,
  player,
  viewerIsSource,
  viewerCanTargetSelf,
  onResolveAction,
  disableCardFlip3d,
  compact,
  overlapCards,
}: MatchPlayerLaneProps) {
  const pendingAction = snapshot.pendingAction;
  const isTargetable =
    viewerIsSource &&
    !!pendingAction &&
    pendingAction.eligibleTargetIds.includes(player.playerId);
  const isSelfTargeting = !!viewerCanTargetSelf && player.playerId === snapshot.viewerPlayerId;
  const incomingActionKindVal = incomingActionKindForPlayer(pendingAction, player.playerId);
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
      disableCardFlip3d={disableCardFlip3d}
      compact={compact}
      overlapCards={overlapCards}
    />
  );
}

type RoundHistorySectionProps = {
  expandedSections: string[];
  onExpandedChange: (value: string[]) => void;
  snapshot: MatchSnapshot;
  tHistory: ReturnType<typeof useTranslations<"RoundHistory">>;
};

function RoundHistorySection({
  expandedSections,
  onExpandedChange,
  snapshot,
  tHistory,
}: RoundHistorySectionProps) {
  return (
    <Card className="w-full">
      <CardContent>
        <Accordion value={expandedSections} onValueChange={onExpandedChange}>
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
                <p className="text-sm text-muted-foreground">
                  {tHistory("currentRoundBreakdownSubtitle")}
                </p>
              </div>
              <ScoreSummary players={snapshot.players} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function incomingActionKindForPlayer(
  pendingAction: MatchSnapshot["pendingAction"],
  playerId: string,
): "flip_three" | "freeze" | null {
  if (!pendingAction || playerId === pendingAction.sourcePlayerId) {
    return null;
  }
  return pendingAction.eligibleTargetIds.includes(playerId) ? pendingAction.actionKind : null;
}

function callTextForSnapshot(
  snapshot: MatchSnapshot,
  activePlayer: MatchSnapshot["players"][number] | undefined,
  t: ReturnType<typeof useTranslations<"GameTable">>,
) {
  if (snapshot.roundStatus === "completed") {
    return t("roundScoredReady");
  }
  if (activePlayer) {
    return t("playerDeciding", { name: activePlayer.displayName });
  }
  return t("waitingResolution");
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
