"use client";

import { useExtracted } from "next-intl";

import type { MatchSnapshot } from "@/game/logic/view-models";
import { cn } from "@/shared/lib/utils";

export type RoundHistoryTableProps = {
  history: MatchSnapshot["roundHistory"];
  players: MatchSnapshot["players"];
};

export function RoundHistoryTable({ history, players }: RoundHistoryTableProps) {
  const t = useExtracted("RoundHistory");
  const orderedPlayers = [...players].toSorted((left, right) => left.seatIndex - right.seatIndex);

  if (history.length === 0) {
    return (
      <section className="space-y-2 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-foreground">{t("Score by round")}</p>
          <p className="text-sm text-muted-foreground">
            {t(
              "Track the running total, the gain from each round, and who is closing in on the target score.",
            )}
          </p>
        </div>
        <div className="rounded-2xl border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          {t("No rounds to show yet. Live history appears as soon as the first round starts.")}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 px-5 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{t("Score by round")}</p>
        <p className="text-sm text-muted-foreground">
          {t(
            "Track the running total, the gain from each round, and who is closing in on the target score.",
          )}
        </p>
      </div>

      <div
        data-testid="round-history-scroll"
        className="overflow-x-auto rounded-2xl border border-dashed"
      >
        <table className="w-full min-w-2xl border-separate border-spacing-0 text-start">
          <thead>
            <tr className="bg-muted/35">
              <th className="sticky inset-s-0 z-20 min-w-40 border-b bg-background px-4 py-3 text-xs font-medium tracking-wide uppercase">
                {t("Player")}
              </th>
              {history.map((entry) => (
                <th
                  key={`${entry.phase}-${entry.roundNumber}`}
                  className={cn(
                    "min-w-40 border-b px-4 py-3 text-xs font-medium tracking-wide uppercase",
                    entry.phase === "projected" && "border-dashed bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {entry.phase === "projected"
                        ? t("R{round}*", { round: String(entry.roundNumber) })
                        : t("R{round}", { round: String(entry.roundNumber) })}
                    </span>
                    {entry.phase === "projected" ? (
                      <span className="rounded-full border border-dashed px-2 py-0.5 text-xs font-semibold text-primary normal-case">
                        {t("Live")}
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedPlayers.map((player) => (
              <tr key={player.playerId} className="align-top">
                <th className="sticky inset-s-0 z-10 border-b bg-background p-4">
                  <div className="text-sm font-medium text-foreground">{player.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("Seat {seat}", { seat: String(player.seatIndex + 1) })}
                  </div>
                </th>
                {history.map((entry) => {
                  const score = entry.scores.find(
                    (candidate) => candidate.playerId === player.playerId,
                  );
                  if (!score) {
                    return null;
                  }

                  const roundHeader =
                    entry.phase === "projected"
                      ? t("R{round}*", { round: String(entry.roundNumber) })
                      : t("R{round}", { round: String(entry.roundNumber) });
                  const statusText = score.reachedTarget
                    ? t("Winner")
                    : t("{points} to target", { points: String(score.pointsToTarget) });

                  return (
                    <td
                      key={`${entry.phase}-${entry.roundNumber}-${player.playerId}`}
                      className={cn(
                        "border-b p-4",
                        entry.phase === "projected" && "border-dashed bg-primary/5",
                        score.reachedTarget && "bg-emerald-500/10",
                      )}
                      aria-label={t("{player}, {round}. Total {total}, round +{gain}. {status}", {
                        player: player.displayName,
                        round: roundHeader,
                        total: String(score.totalScore),
                        gain: String(score.roundScore),
                        status: statusText,
                      })}
                    >
                      <div className="flex min-h-20 flex-col gap-1.5">
                        <div className="text-lg font-semibold text-foreground tabular-nums">
                          {score.totalScore}
                        </div>
                        <div className="text-sm text-muted-foreground tabular-nums">
                          +{score.roundScore}
                          <span className="sr-only">
                            {" "}
                            {t("Gain {gain}", { gain: String(score.roundScore) })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            score.reachedTarget
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-muted-foreground",
                          )}
                        >
                          {score.reachedTarget
                            ? t("Winner")
                            : t("{points} to target", { points: String(score.pointsToTarget) })}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
