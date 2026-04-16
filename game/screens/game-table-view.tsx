"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { PlayerLane } from "@/game/ui/player-lane";
import { ScoreSummary } from "@/game/ui/score-summary";
import { TurnControls } from "@/game/ui/turn-controls";
import type { Id } from "@/convex/_generated/dataModel";
import { formatLatestRoundEventBody } from "@/game/logic/round-event-format";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { cn } from "@/shared/lib/utils";

const GAME_TABLE_LAYOUT_STORAGE_KEY = "flip7:v1:gameTableLayout";

/** Agency motion curve — not linear / ease-in-out */
const easeFluid = "[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]";

const listStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const listItem = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 100, damping: 22 },
  },
};

const revealInView = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.32, 0.72, 0, 1] as const },
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
  /**
   * Force an initial layout mode, bypassing localStorage. Useful in tests to render a specific mode
   * without needing to interact with the toggle.
   */
  initialLayoutMode?: "list" | "table";
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
  initialLayoutMode,
}: GameTableViewProps) {
  const t = useTranslations("GameTable");
  const tEvents = useTranslations("Events");
  const tCards = useTranslations("Cards");
  const tCommon = useTranslations("Common");

  const [layoutMode, setLayoutModeState] = useState<"list" | "table">(() => {
    if (initialLayoutMode !== undefined) {
      return initialLayoutMode;
    }

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
    if (layoutMode === mode) {
      return;
    }

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

  const listLanes = partitionListLanes(snapshot, sortedPlayers.sorted);

  const latestBody = snapshot.latestEvent
    ? formatLatestRoundEventBody(snapshot.latestEvent, tEvents, tCards)
    : tEvents("noneYet");

  const laneProps = { disableCardFlip3d } as const;

  const tableCallSection = (
    <TableCallPanel
      snapshot={snapshot}
      activePlayer={activePlayer}
      viewerPlayer={viewerPlayer}
      onHit={onHit}
      onStay={onStay}
      onResolveAction={onResolveAction}
      onStartNextRound={onStartNextRound}
    />
  );

  const infoPanelLatest = (
    <InfoPanel
      title={t("latestResolution")}
      body={latestBody}
      bodyClassName="game-latest-resolution"
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

  const lanesScrollClass =
    "max-h-[min(68vh,52rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain pr-1";

  const listBody =
    layoutMode === "list" && listLanes.viewer ? (
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "sticky top-0 z-20 -mx-1 px-1 pb-1",
            "bg-gradient-to-b from-[#050505] from-70% to-transparent",
          )}
        >
          <p className="text-[10px] font-medium tracking-[0.2em] text-white/45 uppercase">
            {t("yourHand")}
          </p>
          <div className="mt-2">{renderPlayerLane(listLanes.viewer)}</div>
        </div>
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] text-white/45 uppercase">
            {t("everyoneElse")}
          </p>
          <div className={cn("mt-3 space-y-3", lanesScrollClass)}>
            {freezeLaneLayout ? (
              listLanes.others.map((player) => (
                <div key={player.playerId}>{renderPlayerLane(player)}</div>
              ))
            ) : (
              <motion.div
                variants={listStagger}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {listLanes.others.map((player) => (
                  <motion.div key={player.playerId} variants={listItem}>
                    {renderPlayerLane(player)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    ) : freezeLaneLayout ? (
      <div className={cn("space-y-3", lanesScrollClass)}>
        {sortedPlayers.sorted.map((player) => (
          <div key={player.playerId}>{renderPlayerLane(player)}</div>
        ))}
      </div>
    ) : (
      <motion.div
        variants={listStagger}
        initial="hidden"
        animate="show"
        className={cn("space-y-3", lanesScrollClass)}
      >
        {sortedPlayers.sorted.map((player) => (
          <motion.div key={player.playerId} variants={listItem}>
            {renderPlayerLane(player)}
          </motion.div>
        ))}
      </motion.div>
    );

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={revealInView}
        className={cn(
          "text-foreground relative overflow-hidden rounded-[2rem]",
          "bg-[#050505]",
          "ring-1 ring-white/[0.08]",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_-32px_rgba(0,0,0,0.55)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% -30%, oklch(0.42 0.12 285 / 0.18), transparent 55%), radial-gradient(ellipse 80% 60% at 100% 50%, oklch(0.35 0.08 165 / 0.08), transparent 50%)",
          }}
        />
        <div className="relative px-4 py-5 md:px-6 md:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4 md:gap-6">
            <div className="max-w-xl space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/55 uppercase">
                  {t("matchEyebrow")}
                </span>
                {snapshot.status === "completed" ? (
                  <IconTrophy className="text-primary size-5" />
                ) : null}
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="font-heading text-xl font-medium tracking-tight text-white md:text-2xl">
                  {t("matchTitle", { id: snapshot.matchId.slice(0, 8) })}
                </h1>
                <p className="text-sm leading-relaxed text-white/55">
                  {t("roundRace", {
                    round: snapshot.currentRoundNumber,
                    target: snapshot.targetScore,
                  })}
                </p>
              </div>
            </div>

            <div className="flex max-w-full flex-wrap items-center justify-end gap-2 md:gap-3">
              <LayoutToggle
                layoutMode={layoutMode}
                onSetMode={setLayoutMode}
                layoutAria={t("layoutPreferenceAria")}
                labelList={t("layoutList")}
                labelTable={t("layoutTable")}
              />
              <StatusChip>{t("dealerSeat", { n: snapshot.dealerSeat + 1 })}</StatusChip>
              <StatusChip className="game-match-status" data-status={snapshot.status}>
                {t(`matchStatus.${snapshot.status}`)}
              </StatusChip>
              {activePlayer ? (
                <span className="bg-primary/20 text-primary rounded-full px-3 py-1.5 text-xs font-medium">
                  {t("turnFor", { name: activePlayer.displayName })}
                </span>
              ) : null}
              {isPending ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/80">
                  <span className="border-t-primary size-3.5 animate-spin rounded-full border-2 border-white/20" />
                  {t("updating")}
                </span>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "mt-6 grid gap-4 md:gap-6",
              layoutMode === "list" && "xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]",
            )}
          >
            <div className="flex min-w-0 flex-col gap-4 md:gap-6">
              <div className={cn(layoutMode === "table" && "lg:hidden")}>{tableCallSection}</div>

              <DoubleBezel className={cn(layoutMode === "table" && "lg:hidden")}>
                <div className="p-3 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">
                        {t("tableLayout")}
                      </span>
                      <p className="max-w-md text-sm leading-relaxed text-white/55">
                        {listLanes.viewer ? t("tableLayoutHintViewerFirst") : t("tableLayoutHint")}
                      </p>
                    </div>
                    {snapshot.status !== "completed" && snapshot.roundStatus === "player_turns" ? (
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/85">
                        <span className="text-white/45">{t("whoseTurn")} </span>
                        {activePlayer?.displayName ?? tCommon("waiting")}
                      </span>
                    ) : null}
                  </div>
                  {listBody}
                </div>
              </DoubleBezel>

              <div
                className={cn(
                  "relative hidden min-h-[min(600px,75dvh)] w-full overflow-visible",
                  layoutMode === "table" && "lg:block",
                )}
                data-game-round-table
              >
                <div
                  className="pointer-events-none absolute inset-[8%] rounded-[50%] opacity-60"
                  style={{
                    boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 6%)",
                    background:
                      "radial-gradient(ellipse at center, oklch(0.25 0.02 260 / 0.35), transparent 70%)",
                  }}
                  aria-hidden
                />

                <div className="absolute top-1/2 left-1/2 z-10 w-[min(28rem,calc(100%-1.5rem))] max-w-full -translate-x-1/2 -translate-y-1/2 space-y-4">
                  {tableCallSection}
                  {infoPanelLatest}
                </div>

                <div className="absolute top-5 left-1/2 z-[5] -translate-x-1/2 text-center md:top-8">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">
                    {t("roundTableTitle")}
                  </span>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/45">
                    {t("roundTableHint")}
                  </p>
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
                  <div className="absolute bottom-2 left-1/2 z-20 w-[min(40rem,calc(100%-1rem))] max-w-full -translate-x-1/2 px-1 md:bottom-4">
                    {renderPlayerLane(roundViewer)}
                  </div>
                ) : null}
              </div>
            </div>

            <aside className={cn("min-w-0 space-y-4", layoutMode === "table" && "lg:hidden")}>
              {infoPanelLatest}
            </aside>
          </div>
        </div>
      </motion.section>

      <ScoreSummary players={snapshot.players} />
    </div>
  );
}

function DoubleBezel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/10",
        easeFluid,
        "transition-transform duration-700",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-[calc(2rem-0.375rem)] bg-[oklch(0.14_0.006_260_/_0.92)]",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TableCallPanel({
  snapshot,
  activePlayer,
  viewerPlayer,
  onHit,
  onStay,
  onResolveAction,
  onStartNextRound,
}: {
  snapshot: MatchSnapshot;
  activePlayer: MatchSnapshot["players"][number] | undefined;
  viewerPlayer: MatchSnapshot["players"][number] | undefined;
  onHit: () => void;
  onStay: () => void;
  onResolveAction: (targetPlayerId: Id<"players">) => void;
  onStartNextRound: () => void;
}) {
  const t = useTranslations("GameTable");
  return (
    <DoubleBezel>
      <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between md:gap-5 md:p-5">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">
            {t("tableCall")}
          </span>
          <p className="text-sm leading-relaxed text-white/90">
            {snapshot.roundStatus === "completed"
              ? t("roundScoredReady")
              : activePlayer
                ? t("playerDeciding", { name: activePlayer.displayName })
                : t("waitingResolution")}
          </p>
          {viewerPlayer ? (
            <p className="text-xs text-white/45">
              {t("playingAs", { name: viewerPlayer.displayName })}
            </p>
          ) : (
            <p className="text-xs text-white/45">{t("joinHint")}</p>
          )}
        </div>
        <div className="shrink-0 [&_button]:transition-transform [&_button]:duration-300 [&_button]:ease-[cubic-bezier(0.32,0.72,0,1)] [&_button]:active:scale-[0.98]">
          <TurnControls
            snapshot={snapshot}
            onHit={onHit}
            onStay={onStay}
            onResolveAction={onResolveAction}
            onStartNextRound={onStartNextRound}
          />
        </div>
      </div>
    </DoubleBezel>
  );
}

function LayoutToggle({
  layoutMode,
  onSetMode,
  layoutAria,
  labelList,
  labelTable,
}: {
  layoutMode: "list" | "table";
  onSetMode: (mode: "list" | "table") => void;
  layoutAria: string;
  labelList: string;
  labelTable: string;
}) {
  return (
    <fieldset className="flex items-center gap-0 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10">
      <legend className="sr-only">{layoutAria}</legend>
      <button
        type="button"
        onClick={() => onSetMode("list")}
        aria-pressed={layoutMode === "list"}
        className={cn(
          "rounded-full px-4 py-2 text-xs font-medium",
          easeFluid,
          "duration-500",
          layoutMode === "list"
            ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            : "text-white/45 hover:text-white/75",
        )}
      >
        {labelList}
      </button>
      <button
        type="button"
        onClick={() => onSetMode("table")}
        aria-pressed={layoutMode === "table"}
        className={cn(
          "rounded-full px-4 py-2 text-xs font-medium",
          easeFluid,
          "duration-500",
          layoutMode === "table"
            ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            : "text-white/45 hover:text-white/75",
        )}
      >
        {labelTable}
      </button>
    </fieldset>
  );
}

function StatusChip({ children, className, ...rest }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75",
        easeFluid,
        "duration-500",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4zM5 4H3a2 2 0 0 0 2 2h0M19 4h2a2 2 0 0 1-2 2h0" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
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
    <DoubleBezel>
      <section className="p-4 md:p-5">
        <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">
          {icon ?? <IconAlert className="size-3.5 shrink-0 text-white/40" />}
          {title}
        </div>
        <div className={cn("mt-3 text-sm leading-relaxed text-white/90", bodyClassName)}>
          {body}
        </div>
        {subtext ? <div className="mt-2 text-xs text-white/45">{subtext}</div> : null}
      </section>
    </DoubleBezel>
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

function partitionListLanes(
  snapshot: MatchSnapshot,
  sorted: MatchSnapshot["players"],
): { viewer: MatchSnapshot["players"][number] | null; others: MatchSnapshot["players"] } {
  const viewerId = snapshot.viewerPlayerId;
  if (!viewerId) {
    return { viewer: null, others: sorted };
  }
  const viewer = snapshot.players.find((p) => p.playerId === viewerId) ?? null;
  const others = sorted.filter((p) => p.playerId !== viewerId);
  return { viewer, others };
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
