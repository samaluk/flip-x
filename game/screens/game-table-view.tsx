"use client";

import {
  AlertTriangleIcon,
  CircleDotIcon,
  RefreshCwIcon,
  TrophyIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import { LazyMotion, domAnimation, m } from "motion/react";
import type { Variants } from "motion/react";
import { useExtracted } from "next-intl";
import { type ReactNode, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { useLatestRoundEventBody } from "@/game/ui/use-round-event-format";
import { PlayerLane } from "@/game/ui/player-lane";
import { RoundHistoryTable } from "@/game/ui/round-history-table";
import { ScoreSummary } from "@/game/ui/score-summary";
import { TurnControls } from "@/game/ui/turn-controls";
import { resolveTurnControlsPhase } from "@/game/ui/turn-controls-phase";
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
  const latestBody = useLatestRoundEventBody(snapshot.latestEvent);

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

  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  const viewerPlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.viewerPlayerId,
  );
  const { viewer, opponents } = partitionPlayers(snapshot);
  const opponentsGridClass = opponentsGridCols(opponents.length);
  const hasTurnControls = resolveTurnControlsPhase(snapshot).kind !== "none";
  const controlsPending = isPending || !!snapshot.optimisticTurn;

  const turnControls = (
    <TurnControls
      snapshot={snapshot}
      onHit={onHit}
      onStay={onStay}
      onStartNextRound={onStartNextRound}
    />
  );

  return (
    <GameTableLayout
      snapshot={snapshot}
      isPending={controlsPending}
      latestBody={latestBody}
      activePlayer={activePlayer}
      viewerPlayer={viewerPlayer}
      viewer={viewer}
      opponents={opponents}
      opponentsGridClass={opponentsGridClass}
      freezeLaneLayout={freezeLaneLayout}
      viewerIsSource={viewerIsSource}
      viewerCanTargetSelf={viewerCanTargetSelf}
      onResolveAction={onResolveAction}
      disableCardFlip3d={disableCardFlip3d}
      hasTurnControls={hasTurnControls}
      turnControls={turnControls}
    />
  );
}

type GameTableLayoutProps = {
  snapshot: MatchSnapshot;
  isPending: boolean;
  latestBody: string;
  activePlayer: MatchSnapshot["players"][number] | undefined;
  viewerPlayer: MatchSnapshot["players"][number] | undefined;
  viewer: MatchSnapshot["players"][number] | null;
  opponents: MatchSnapshot["players"];
  opponentsGridClass: string;
  freezeLaneLayout: boolean;
  viewerIsSource: boolean;
  viewerCanTargetSelf: boolean;
  onResolveAction: (targetPlayerId: Id<"players">) => void;
  disableCardFlip3d: boolean;
  hasTurnControls: boolean;
  turnControls: ReactNode;
};

function GameTableLayout({
  snapshot,
  isPending,
  latestBody,
  activePlayer,
  viewerPlayer,
  viewer,
  opponents,
  opponentsGridClass,
  freezeLaneLayout,
  viewerIsSource,
  viewerCanTargetSelf,
  onResolveAction,
  disableCardFlip3d,
  hasTurnControls,
  turnControls,
}: GameTableLayoutProps) {
  return (
    <LazyMotion features={domAnimation}>
      <div className={cn("flex flex-col gap-4", hasTurnControls ? "pb-36 lg:pb-4" : "pb-4")}>
        <GameTableHud
          snapshot={snapshot}
          isPending={isPending}
          latestBody={latestBody}
          activePlayer={activePlayer}
          viewerPlayer={viewerPlayer}
        />
        <GameTablePlayers
          snapshot={snapshot}
          viewer={viewer}
          opponents={opponents}
          opponentsGridClass={opponentsGridClass}
          freezeLaneLayout={freezeLaneLayout}
          viewerIsSource={viewerIsSource}
          viewerCanTargetSelf={viewerCanTargetSelf}
          onResolveAction={onResolveAction}
          disableCardFlip3d={disableCardFlip3d}
        />
        <RoundHistorySection snapshot={snapshot} />
        <GameTableTurnControls hasTurnControls={hasTurnControls} controls={turnControls} />
      </div>
    </LazyMotion>
  );
}

function GameTableTurnControls({
  hasTurnControls,
  controls,
}: {
  hasTurnControls: boolean;
  controls: ReactNode;
}) {
  if (!hasTurnControls) {
    return null;
  }
  return (
    <>
      <TurnControlsDesktop controls={controls} />
      <TurnControlsMobile controls={controls} />
    </>
  );
}

type GameTablePlayersProps = {
  snapshot: MatchSnapshot;
  viewer: MatchSnapshot["players"][number] | null;
  opponents: MatchSnapshot["players"];
  opponentsGridClass: string;
  freezeLaneLayout: boolean;
  viewerIsSource: boolean;
  viewerCanTargetSelf: boolean;
  onResolveAction: (targetPlayerId: Id<"players">) => void;
  disableCardFlip3d: boolean;
};

function GameTablePlayers({
  viewer,
  opponents,
  opponentsGridClass,
  snapshot,
  freezeLaneLayout,
  viewerIsSource,
  viewerCanTargetSelf,
  onResolveAction,
  disableCardFlip3d,
}: GameTablePlayersProps) {
  const t = useExtracted("GameTable");

  return (
    <>
      <GameTableOpponentsSection
        opponents={opponents}
        opponentsGridClass={opponentsGridClass}
        snapshot={snapshot}
        freezeLaneLayout={freezeLaneLayout}
        viewerIsSource={viewerIsSource}
        viewerCanTargetSelf={viewerCanTargetSelf}
        onResolveAction={onResolveAction}
        disableCardFlip3d={disableCardFlip3d}
      />
      {viewer ? (
        <section aria-label={t("Your hand")} className="space-y-2">
          <div className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("Your hand")}
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
    </>
  );
}

function TurnControlsDesktop({ controls }: { controls: ReactNode }) {
  const t = useExtracted("GameTable");

  return (
    <section
      aria-label={t("Turn actions")}
      className="surface-elevated hidden rounded-2xl px-4 py-3 lg:block"
    >
      {controls}
    </section>
  );
}

function TurnControlsMobile({ controls }: { controls: ReactNode }) {
  const t = useExtracted("GameTable");

  return (
    <section
      aria-label={t("Turn actions")}
      className="fixed inset-x-0 bottom-0 z-30 max-h-svh overflow-y-auto border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto max-w-5xl">{controls}</div>
    </section>
  );
}

type HudPlayer = MatchSnapshot["players"][number];

type CallTextLabels = {
  scored: string;
  deciding: (name: string) => string;
  waiting: string;
};

function resolveCallText(
  {
    roundStatus,
    activeDisplayName,
  }: {
    roundStatus: MatchSnapshot["roundStatus"];
    activeDisplayName: string | undefined;
  },
  labels: CallTextLabels,
): string {
  if (roundStatus === "completed") {
    return labels.scored;
  }
  if (activeDisplayName) {
    return labels.deciding(activeDisplayName);
  }
  return labels.waiting;
}

type GameTableHudProps = {
  snapshot: MatchSnapshot;
  isPending: boolean;
  latestBody: string;
  activePlayer: HudPlayer | undefined;
  viewerPlayer: HudPlayer | undefined;
};

function GameTableHud({
  snapshot,
  isPending,
  latestBody,
  activePlayer,
  viewerPlayer,
}: GameTableHudProps) {
  const t = useExtracted("GameTable");
  const callText = resolveCallText(
    { roundStatus: snapshot.roundStatus, activeDisplayName: activePlayer?.displayName },
    {
      scored: t("The round is scored and ready for the next deal."),
      deciding: (name) =>
        t("{name} is deciding whether to push or bank points.", {
          name,
        }),
      waiting: t("Waiting for the next resolution."),
    },
  );

  return (
    <section
      aria-label={t("Match {id}", { id: snapshot.matchId.slice(0, 8) })}
      className="surface-elevated overflow-hidden rounded-2xl text-foreground"
    >
      <MatchHeader snapshot={snapshot} isPending={isPending} activePlayer={activePlayer} />
      <div className="grid gap-3 border-t border-border px-4 py-2.5 sm:grid-cols-2 sm:px-5">
        <TableCall callText={callText} viewerPlayer={viewerPlayer} />
        <LatestResolution
          latestBody={latestBody}
          latestPlayerNames={snapshot.latestEvent?.playerNames}
        />
      </div>
    </section>
  );
}

type MatchHeaderProps = {
  snapshot: MatchSnapshot;
  isPending: boolean;
  activePlayer: HudPlayer | undefined;
};

function MatchHeader({ snapshot, isPending, activePlayer }: MatchHeaderProps) {
  const t = useExtracted("GameTable");
  const matchComplete = snapshot.status === "completed";

  let matchStatus: string;
  switch (snapshot.status) {
    case "setup":
      matchStatus = t("setup");
      break;
    case "in_progress":
      matchStatus = t("in progress");
      break;
    case "completed":
      matchStatus = t("completed");
      break;
    default: {
      const exhaustiveCheck: never = snapshot.status;
      matchStatus = exhaustiveCheck;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {matchComplete ? (
          <TrophyIcon className="size-5 shrink-0 text-primary" aria-hidden />
        ) : (
          <CircleDotIcon className="size-5 shrink-0 text-primary" aria-hidden />
        )}
        <div className="flex min-w-0 flex-col leading-tight">
          <h1 className="truncate font-heading text-sm font-medium tracking-tight text-foreground sm:text-base">
            {t("Match {id}", { id: snapshot.matchId.slice(0, 8) })}
          </h1>
          <span className="text-xs text-muted-foreground">
            {t("Round {round} of a race to {target} points.", {
              round: String(snapshot.currentRoundNumber),
              target: String(snapshot.targetScore),
            })}
          </span>
        </div>
      </div>

      <div className="ms-auto flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" data-slot="match-status" data-status={snapshot.status}>
          {matchStatus}
        </Badge>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {t("Dealer position {n}", { n: String(snapshot.dealerSeat + 1) })}
        </Badge>
        {activePlayer ? (
          <Badge variant="default" className="max-w-48">
            <UserRoundIcon className="size-3" aria-hidden />
            <span className="truncate">
              {t("Turn: {name}", { name: activePlayer.displayName })}
            </span>
          </Badge>
        ) : null}
        {isPending ? (
          <Badge variant="secondary" aria-live="polite">
            <RefreshCwIcon className="size-3 animate-spin" aria-hidden />
            <span className="hidden sm:inline">{t("Updating")}</span>
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

type TableCallProps = {
  callText: string;
  viewerPlayer: HudPlayer | undefined;
};

function TableCall({ callText, viewerPlayer }: TableCallProps) {
  const t = useExtracted("GameTable");

  return (
    <div className="space-y-0.5">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t("Table call")}
      </div>
      <div className="text-sm leading-snug text-foreground">{callText}</div>
      {viewerPlayer ? (
        <div className="text-xs text-muted-foreground">
          {t("You are playing as {name}", { name: viewerPlayer.displayName })}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {t("Join this game on this device to take turns.")}
        </div>
      )}
    </div>
  );
}

type LatestResolutionProps = {
  latestBody: string;
  latestPlayerNames: string | undefined;
};

function LatestResolution({ latestBody, latestPlayerNames }: LatestResolutionProps) {
  const t = useExtracted("GameTable");

  return (
    <div className="space-y-0.5 border-t border-border pt-2.5 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <AlertTriangleIcon className="size-3" aria-hidden />
        {t("Latest resolution")}
      </div>
      <div data-slot="game-latest-resolution" className="text-sm leading-snug text-foreground">
        {latestBody}
      </div>
      {latestPlayerNames ? (
        <div className="text-xs text-muted-foreground">{latestPlayerNames}</div>
      ) : null}
    </div>
  );
}

type GameTableOpponentsSectionProps = {
  opponents: MatchSnapshot["players"];
  opponentsGridClass: string;
  freezeLaneLayout: boolean;
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
  snapshot,
  viewerIsSource,
  viewerCanTargetSelf,
  onResolveAction,
  disableCardFlip3d,
}: GameTableOpponentsSectionProps) {
  const t = useExtracted("GameTable");

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
    <section aria-label={t("Opponents")} className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <UsersIcon className="size-3.5" aria-hidden />
          <span>{t("Opponents")}</span>
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
        <m.div variants={listStagger} initial="hidden" animate="show" className={gridClass}>
          {opponents.map((player) => (
            <m.div key={player.playerId} variants={listItem}>
              {laneFor(player)}
            </m.div>
          ))}
        </m.div>
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
    viewerIsSource && !!pendingAction && pendingAction.eligibleTargetIds.includes(player.playerId);
  const isSelfTargeting = viewerCanTargetSelf && player.playerId === snapshot.viewerPlayerId;
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
      isActionSource={viewerIsSource}
      isTargetable={isTargetable}
      isSelfTargeting={isSelfTargeting}
      incomingActionKind={incomingActionKindVal}
      flip3Remaining={flip3RemainingVal}
      onSelectTarget={
        viewerIsSource ? (playerId: Id<"players">) => onResolveAction(playerId) : undefined
      }
      disableCardFlip3d={disableCardFlip3d}
      compact={compact}
      overlapCards={overlapCards}
    />
  );
}

type RoundHistorySectionProps = {
  snapshot: MatchSnapshot;
};

function RoundHistorySection({ snapshot }: RoundHistorySectionProps) {
  const tHistory = useExtracted("RoundHistory");
  const [prevRoundStatus, setPrevRoundStatus] = useState(snapshot.roundStatus);
  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    snapshot.roundStatus === "completed" ? ["history", "breakdown"] : ["history"],
  );

  if (snapshot.roundStatus !== prevRoundStatus) {
    setPrevRoundStatus(snapshot.roundStatus);
    if (snapshot.roundStatus === "completed") {
      setExpandedSections((current) =>
        current.includes("breakdown") ? current : [...current, "breakdown"],
      );
    }
  }

  return (
    <Card className="w-full">
      <CardContent>
        <Accordion value={expandedSections} onValueChange={setExpandedSections}>
          <AccordionItem value="history">
            <AccordionTrigger className="text-xl">{tHistory("Score by round")}</AccordionTrigger>
            <AccordionContent>
              <RoundHistoryTable history={snapshot.roundHistory} players={snapshot.players} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="breakdown">
            <AccordionTrigger className="text-xl">
              {tHistory("Current round breakdown")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-5 pt-2">
                <p className="text-sm text-muted-foreground">
                  {tHistory("Detailed scoring for the active or most recently completed round.")}
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

/** Viewer first/pinned, opponents in seat order. */
function partitionPlayers(snapshot: MatchSnapshot) {
  const bySeat = [...snapshot.players].toSorted((a, b) => a.seatIndex - b.seatIndex);
  const viewerId = snapshot.viewerPlayerId;
  if (!viewerId) {
    return {
      // oxlint-disable-next-line typescript/consistent-type-assertions
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
