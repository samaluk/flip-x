"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangleIcon, RefreshCwIcon, TrophyIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { PlayerLane } from "@/components/game/player-lane";
import { ScoreSummary } from "@/components/game/score-summary";
import { TurnControls } from "@/components/game/turn-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { formatLatestRoundEventBody } from "@/lib/round-event-format";
import type { MatchSnapshot } from "@/lib/game/view-models";
import { cn } from "@/lib/utils";

const GAME_TABLE_LAYOUT_STORAGE_KEY = "flip7:v1:gameTableLayout";

const listStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
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
  const tCommon = useTranslations("Common");

  const [layoutMode, setLayoutModeState] = useState<"list" | "table">(() => {
    if (typeof window === "undefined") {
      return "list";
    }

    try {
      const raw = window.localStorage.getItem(GAME_TABLE_LAYOUT_STORAGE_KEY);
      return raw === "table" ? "table" : "list";
    } catch {
      return "list";
    }
  });

  const setLayoutMode = (mode: "list" | "table") => {
    setLayoutModeState(mode);
    try {
      window.localStorage.setItem(GAME_TABLE_LAYOUT_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const viewerPlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.viewerPlayerId,
  );
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  const sortedPlayers = getSortedPlayers(snapshot);
  const { viewer: roundViewer, opponents: roundOpponents } = getRoundTablePartition(snapshot);
  const opponentSlots = opponentArcSlots(roundOpponents.length);

  const latestBody = snapshot.latestEvent
    ? formatLatestRoundEventBody(snapshot.latestEvent, tEvents, tCards)
    : tEvents("noneYet");

  const laneProps = { disableCardFlip3d } as const;

  const tableCallSection = (
    <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-4">
      <div className="space-y-1">
        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t("tableCall")}
        </div>
        <div className="text-foreground text-sm">
          {snapshot.roundStatus === "completed"
            ? t("roundScoredReady")
            : activePlayer
              ? t("playerDeciding", { name: activePlayer.displayName })
              : t("waitingResolution")}
        </div>
        {viewerPlayer ? (
          <div className="text-muted-foreground text-xs">
            {t("playingAs", { name: viewerPlayer.displayName })}
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">{t("joinHint")}</div>
        )}
      </div>
      <TurnControls
        snapshot={snapshot}
        onHit={onHit}
        onStay={onStay}
        onResolveAction={onResolveAction}
        onStartNextRound={onStartNextRound}
      />
    </div>
  );

  const infoPanelLatest = (
    <InfoPanel
      title={t("latestResolution")}
      body={latestBody}
      bodyClassName="game-latest-resolution"
      icon={<AlertTriangleIcon className="text-muted-foreground size-4" />}
      subtext={snapshot.latestEvent?.playerNames}
    />
  );

  const renderPlayerLane = (
    player: MatchSnapshot["players"][number],
    options: {
      compact?: boolean;
      overlapCards?: boolean;
    } = {},
  ) => (
    <PlayerLane
      player={player}
      isActive={snapshot.activePlayerId === player.playerId}
      isViewer={snapshot.viewerPlayerId === player.playerId}
      isDealer={player.seatIndex === snapshot.dealerSeat}
      {...laneProps}
      {...options}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="surface-elevated text-foreground overflow-hidden rounded-2xl">
        <div className="border-border flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-foreground text-xl font-medium tracking-tight">
                {t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
              </h1>
              {snapshot.status === "completed" ? (
                <TrophyIcon className="text-primary size-5" />
              ) : null}
            </div>
            <div className="text-muted-foreground text-sm">
              {t("roundRace", {
                round: snapshot.currentRoundNumber,
                target: snapshot.targetScore,
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="border-border bg-muted/20 hidden items-center gap-1 rounded-lg border p-0.5 lg:flex"
              role="group"
              aria-label={t("layoutPreferenceAria")}
            >
              <Button
                type="button"
                variant={layoutMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setLayoutMode("list")}
                aria-pressed={layoutMode === "list"}
              >
                {t("layoutList")}
              </Button>
              <Button
                type="button"
                variant={layoutMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setLayoutMode("table")}
                aria-pressed={layoutMode === "table"}
              >
                {t("layoutTable")}
              </Button>
            </div>
            <Badge variant="outline">{t("dealerSeat", { n: snapshot.dealerSeat + 1 })}</Badge>
            <Badge variant="outline" className="game-match-status" data-status={snapshot.status}>
              {t(`matchStatus.${snapshot.status}`)}
            </Badge>
            {activePlayer ? (
              <Badge variant="default">{t("turnFor", { name: activePlayer.displayName })}</Badge>
            ) : null}
            {isPending ? (
              <Badge variant="secondary">
                <RefreshCwIcon className="size-3 animate-spin" />
                {t("updating")}
              </Badge>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "grid gap-5 px-5 py-5",
            layoutMode === "list" && "xl:grid-cols-[minmax(0,1fr)_20rem]",
          )}
        >
          <div className="space-y-5">
            <div className={cn(layoutMode === "table" && "lg:hidden")}>{tableCallSection}</div>

            <section
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                layoutMode === "table" && "lg:hidden",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <div>
                  <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("tableLayout")}
                  </div>
                  <div className="text-muted-foreground text-sm">{t("tableLayoutHint")}</div>
                </div>
                {snapshot.status !== "completed" && snapshot.roundStatus === "player_turns" ? (
                  <Badge variant="outline">
                    <UserRoundIcon className="size-3.5" />
                    {activePlayer?.displayName ?? tCommon("waiting")}
                  </Badge>
                ) : null}
              </div>

              {freezeLaneLayout ? (
                <div className="bg-card max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {sortedPlayers.sorted.map((player) => (
                    <div key={player.playerId}>{renderPlayerLane(player)}</div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={listStagger}
                  initial="hidden"
                  animate="show"
                  className="bg-card max-h-[60vh] space-y-3 overflow-y-auto pr-1"
                >
                  <AnimatePresence>
                    {sortedPlayers.sorted.map((player) => (
                      <motion.div
                        key={player.playerId}
                        variants={listItem}
                        layout
                        layoutId={player.playerId}
                      >
                        {renderPlayerLane(player)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>

            <div
              className={cn(
                "relative hidden min-h-[min(720px,82svh)] w-full overflow-visible rounded-xl border border-border bg-card/50 p-4",
                layoutMode === "table" && "lg:block",
              )}
              data-game-round-table
            >
              <div
                className="border-border/50 bg-muted/15 pointer-events-none absolute inset-[10%] rounded-[50%] border border-dashed shadow-inner"
                aria-hidden
              />

              <div className="absolute top-1/2 left-1/2 z-10 w-[min(28rem,calc(100%-1.5rem))] max-w-full -translate-x-1/2 -translate-y-1/2 space-y-4">
                {tableCallSection}
                {infoPanelLatest}
              </div>

              <div className="absolute top-3 left-1/2 z-[5] -translate-x-1/2 text-center">
                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("roundTableTitle")}
                </div>
                <div className="text-muted-foreground text-xs">{t("roundTableHint")}</div>
              </div>

              {roundOpponents.map((player, index) => {
                const slot = opponentSlots[index];
                if (!slot) {
                  return null;
                }
                return (
                  <div
                    key={player.playerId}
                    className="absolute z-[8] w-[min(18rem,calc(42vw-0.5rem))] max-w-[95%] -translate-x-1/2 -translate-y-1/2"
                    style={{ top: slot.top, left: slot.left }}
                  >
                    {renderPlayerLane(player, { compact: true, overlapCards: true })}
                  </div>
                );
              })}

              {roundViewer ? (
                <div className="absolute bottom-1 left-1/2 z-20 w-[min(40rem,calc(100%-1rem))] max-w-full -translate-x-1/2 px-1">
                  {renderPlayerLane(roundViewer)}
                </div>
              ) : null}
            </div>
          </div>

          <aside className={cn("space-y-5", layoutMode === "table" && "lg:hidden")}>
            {infoPanelLatest}
          </aside>
        </div>
      </section>

      <ScoreSummary players={snapshot.players} />
    </div>
  );
}

function getSortedPlayers(snapshot: MatchSnapshot) {
  const viewerId = snapshot.viewerPlayerId;
  const activeId = snapshot.activePlayerId;
  const dealerSeat = snapshot.dealerSeat;

  const players = [...snapshot.players];

  if (activeId) {
    const active = players.find((p) => p.playerId === activeId);
    const others = players.filter((p) => p.playerId !== activeId);
    return { active, others, sorted: [active!, ...others] };
  }

  if (viewerId) {
    const dealer = players.find((p) => p.seatIndex === dealerSeat) ?? players[0];
    const withoutDealer = players.filter((p) => p.playerId !== dealer?.playerId);
    withoutDealer.sort((a, b) => a.seatIndex - b.seatIndex);
    return { active: null, others: withoutDealer, sorted: withoutDealer };
  }

  const dealer = players.find((p) => p.seatIndex === dealerSeat) ?? players[0];
  const withoutDealer = players.filter((p) => p.playerId !== dealer?.playerId);
  withoutDealer.sort((a, b) => a.seatIndex - b.seatIndex);
  return { active: null, others: withoutDealer, sorted: withoutDealer };
}

function getRoundTablePartition(snapshot: MatchSnapshot) {
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

/** Percent positions; element uses -translate-x-1/2 -translate-y-1/2 for anchor. */
function opponentArcSlots(count: number): Array<{ top: string; left: string }> {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [{ top: "6%", left: "50%" }];
  }
  if (count === 2) {
    return [
      { top: "48%", left: "10%" },
      { top: "48%", left: "90%" },
    ];
  }
  if (count === 3) {
    return [
      { top: "48%", left: "10%" },
      { top: "6%", left: "50%" },
      { top: "48%", left: "90%" },
    ];
  }
  const cx = 50;
  const cy = 40;
  const r = 36;
  const slots: Array<{ top: string; left: string }> = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.PI - (Math.PI * i) / (count - 1);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    slots.push({ top: `${y}%`, left: `${x}%` });
  }
  return slots;
}

function InfoPanel({
  title,
  body,
  bodyClassName,
  icon,
  subtext,
}: {
  title: string;
  body: string;
  bodyClassName?: string;
  icon?: ReactNode;
  subtext?: string;
}) {
  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        {icon}
        {title}
      </div>
      <div className={cn("mt-2 text-sm leading-6 text-foreground", bodyClassName)}>{body}</div>
      {subtext && <div className="text-muted-foreground mt-1 text-xs">{subtext}</div>}
    </section>
  );
}
