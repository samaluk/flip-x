"use client";

import { useMutation } from "convex/react";
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  SparklesIcon,
  TrophyIcon,
  UserRoundIcon,
} from "lucide-react";
import { type ReactNode, useTransition } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PlayerLane } from "@/components/game/player-lane";
import { ScoreSummary } from "@/components/game/score-summary";
import { TurnControls } from "@/components/game/turn-controls";
import { Button } from "@/components/ui/button";
import type { MatchSnapshot } from "@/lib/game/view-models";

export function GameTable({ snapshot, sessionId }: { snapshot: MatchSnapshot; sessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const takeTurn = useMutation(api.turns.takeTurn);
  const resolveAction = useMutation(api.turns.resolveAction);
  const startNextRound = useMutation(api.rounds.startNextRound);
  const viewerPlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.viewerPlayerId,
  );

  function runAction(action: () => Promise<unknown>) {
    startTransition(() => {
      action().catch((error) => {
        toast.error(error instanceof Error ? error.message : "Game action failed.");
      });
    });
  }

  const dealerPlayer =
    snapshot.players.find((player) => player.seatIndex === snapshot.dealerSeat) ??
    snapshot.players[0];
  const tablePlayers = snapshot.players.filter(
    (player) => player.playerId !== dealerPlayer?.playerId,
  );
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#f3d48a]/20 bg-[linear-gradient(180deg,rgba(12,31,46,0.97)_0%,rgba(6,17,26,0.98)_100%)] text-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl tracking-[0.08em] uppercase text-[#f8ead0]">
                Match {snapshot.matchId.slice(0, 8)}
              </h1>
              {snapshot.status === "completed" ? (
                <TrophyIcon className="size-5 text-[#f3d48a]" />
              ) : null}
            </div>
            <div className="text-sm text-[#cfd9df]">
              Round {snapshot.currentRoundNumber} of a race to {snapshot.targetScore} points.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TablePill>Dealer seat {snapshot.dealerSeat + 1}</TablePill>
            <TablePill>{snapshot.status.replace("_", " ")}</TablePill>
            {activePlayer ? <TablePill>Turn: {activePlayer.displayName}</TablePill> : null}
            {isPending ? (
              <TablePill>
                <RefreshCwIcon className="size-3.5 animate-spin" />
                Updating
              </TablePill>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 px-5 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#f3d48a]/20 bg-[#0c2031]/70 px-4 py-4">
              <div className="space-y-1">
                <div className="font-heading text-[0.72rem] tracking-[0.24em] uppercase text-[#8cb1c4]">
                  Table call
                </div>
                <div className="text-sm text-[#d9e5eb]">
                  {snapshot.roundStatus === "completed"
                    ? "The round is scored and ready for the next deal."
                    : activePlayer
                      ? `${activePlayer.displayName} is deciding whether to push or bank points.`
                      : "Waiting for the next resolution."}
                </div>
                {viewerPlayer ? (
                  <div className="text-xs tracking-[0.18em] uppercase text-[#8cb1c4]">
                    You are playing as {viewerPlayer.displayName}
                  </div>
                ) : (
                  <div className="text-xs tracking-[0.18em] uppercase text-[#8cb1c4]">
                    Claim a seat on this device to take turns.
                  </div>
                )}
              </div>
              <TurnControls
                snapshot={snapshot}
                onHit={() =>
                  runAction(() =>
                    takeTurn({
                      matchId: snapshot.matchId as Id<"matches">,
                      sessionId: sessionId,
                      action: "hit",
                    }),
                  )
                }
                onStay={() =>
                  runAction(() =>
                    takeTurn({
                      matchId: snapshot.matchId as Id<"matches">,
                      sessionId: sessionId,
                      action: "stay",
                    }),
                  )
                }
                onResolveAction={(targetPlayerId) =>
                  runAction(() =>
                    resolveAction({
                      matchId: snapshot.matchId as Id<"matches">,
                      sessionId: sessionId,
                      targetPlayerId,
                    }),
                  )
                }
                onStartNextRound={() =>
                  runAction(() =>
                    startNextRound({
                      matchId: snapshot.matchId as Id<"matches">,
                      sessionId: sessionId,
                    }),
                  )
                }
              />
            </div>

            <section className="table-felt rounded-[2rem] border border-[#f3d48a]/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_rgba(0,0,0,0.3)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <div>
                  <div className="font-heading text-[0.72rem] tracking-[0.28em] uppercase text-[#a7c6d5]">
                    Table layout
                  </div>
                  <div className="text-sm text-[#e5eef3]">
                    The dealer sits at the bottom, with every other seat arrayed around the felt.
                  </div>
                </div>
                {snapshot.status !== "completed" && snapshot.roundStatus === "player_turns" ? (
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/10 bg-black/10 px-4 text-[#f8ead0] hover:bg-white/8 hover:text-white"
                  >
                    <UserRoundIcon />
                    {activePlayer?.displayName ?? "Waiting"}
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
                {tablePlayers.map((player) => (
                  <PlayerLane
                    key={player.playerId}
                    player={player}
                    isActive={snapshot.activePlayerId === player.playerId}
                    isViewer={snapshot.viewerPlayerId === player.playerId}
                  />
                ))}
              </div>

              {dealerPlayer ? (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="mb-3 font-heading text-[0.72rem] tracking-[0.28em] uppercase text-[#a7c6d5]">
                    Dealer position
                  </div>
                  <PlayerLane
                    player={dealerPlayer}
                    isActive={snapshot.activePlayerId === dealerPlayer.playerId}
                    isDealer
                    isViewer={snapshot.viewerPlayerId === dealerPlayer.playerId}
                  />
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-4">
            <InfoPanel
              title="Latest resolution"
              body={snapshot.latestEvent?.summary ?? "No table event has been logged yet."}
              icon={<AlertTriangleIcon className="size-4 text-[#f3d48a]" />}
            />
            <InfoPanel
              title="Round ending"
              body={
                snapshot.endedBy === "flip7"
                  ? "Someone revealed seven unique numbers and ended the round immediately."
                  : snapshot.endedBy === "all_inactive"
                    ? "Every player is out of the round, so scoring can settle."
                    : "The round is still live. Duplicate numbers still bust unless Second Chance intervenes."
              }
              icon={<SparklesIcon className="size-4 text-[#f3d48a]" />}
            />
            <InfoPanel
              title="Rules reminder"
              body="Modifiers do not bust a player. The x2 doubles only the number-card total before additive bonus cards are added."
            />
          </aside>
        </div>
      </section>

      <ScoreSummary players={snapshot.players} />
    </div>
  );
}

function TablePill({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#f3d48a]/30 bg-[#f3d48a]/10 px-3 py-1.5 text-xs font-medium tracking-[0.18em] uppercase text-[#f3d48a]">
      {children}
    </div>
  );
}

function InfoPanel({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,31,46,0.97)_0%,rgba(8,18,28,0.96)_100%)] p-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-2 font-heading text-[0.72rem] tracking-[0.24em] uppercase text-[#8cb1c4]">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-[#d9e5eb]">{body}</div>
    </section>
  );
}
