"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangleIcon, RefreshCwIcon, TrophyIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";

import { PlayerLane } from "@/components/game/player-lane";
import { ScoreSummary } from "@/components/game/score-summary";
import { TurnControls } from "@/components/game/turn-controls";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { formatLatestRoundEventBody } from "@/lib/round-event-format";
import type { MatchSnapshot } from "@/lib/game/view-models";
import { cn } from "@/lib/utils";

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

  const viewerPlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.viewerPlayerId,
  );
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  const sortedPlayers = getSortedPlayers(snapshot);

  const latestBody = snapshot.latestEvent
    ? formatLatestRoundEventBody(snapshot.latestEvent, tEvents, tCards)
    : tEvents("noneYet");

  const laneProps = { disableCardFlip3d } as const;

  return (
    <div className="flex flex-col gap-6">
      <section className="surface-elevated overflow-hidden rounded-2xl text-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-xl tracking-tight font-medium text-foreground">
                {t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
              </h1>
              {snapshot.status === "completed" ? (
                <TrophyIcon className="size-5 text-primary" />
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("roundRace", {
                round: snapshot.currentRoundNumber,
                target: snapshot.targetScore,
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-4">
              <div className="space-y-1">
                <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  {t("tableCall")}
                </div>
                <div className="text-sm text-foreground">
                  {snapshot.roundStatus === "completed"
                    ? t("roundScoredReady")
                    : activePlayer
                      ? t("playerDeciding", { name: activePlayer.displayName })
                      : t("waitingResolution")}
                </div>
                {viewerPlayer ? (
                  <div className="text-xs text-muted-foreground">
                    {t("playingAs", { name: viewerPlayer.displayName })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t("claimSeatHint")}</div>
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

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <div>
                  <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                    {t("tableLayout")}
                  </div>
                  <div className="text-sm text-muted-foreground">{t("tableLayoutHint")}</div>
                </div>
                {snapshot.status !== "completed" && snapshot.roundStatus === "player_turns" ? (
                  <Badge variant="outline">
                    <UserRoundIcon className="size-3.5" />
                    {activePlayer?.displayName ?? tCommon("waiting")}
                  </Badge>
                ) : null}
              </div>

              {freezeLaneLayout ? (
                <div className="max-h-[60vh] space-y-3 overflow-y-auto bg-card pr-1">
                  {sortedPlayers.sorted.map((player) => (
                    <div key={player.playerId}>
                      <PlayerLane
                        player={player}
                        isActive={snapshot.activePlayerId === player.playerId}
                        isViewer={snapshot.viewerPlayerId === player.playerId}
                        {...laneProps}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={listStagger}
                  initial="hidden"
                  animate="show"
                  className="max-h-[60vh] space-y-3 overflow-y-auto bg-card pr-1"
                >
                  <AnimatePresence>
                    {sortedPlayers.sorted.map((player) => (
                      <motion.div
                        key={player.playerId}
                        variants={listItem}
                        layout
                        layoutId={player.playerId}
                      >
                        <PlayerLane
                          player={player}
                          isActive={snapshot.activePlayerId === player.playerId}
                          isViewer={snapshot.viewerPlayerId === player.playerId}
                          {...laneProps}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <InfoPanel
              title={t("latestResolution")}
              body={latestBody}
              bodyClassName="game-latest-resolution"
              icon={<AlertTriangleIcon className="size-4 text-muted-foreground" />}
              subtext={snapshot.latestEvent?.playerNames}
            />
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
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className={cn("mt-2 text-sm leading-6 text-foreground", bodyClassName)}>{body}</div>
      {subtext && <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>}
    </section>
  );
}
