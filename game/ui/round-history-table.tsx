"use client";

import { useTranslations } from "next-intl";

import type { MatchSnapshot } from "@/game/logic/view-models";
import { cn } from "@/shared/lib/utils";

type RoundHistoryTableProps = {
  history: MatchSnapshot["roundHistory"];
  players: MatchSnapshot["players"];
};

export function RoundHistoryTable({ history, players }: RoundHistoryTableProps) {
  const t = useTranslations("RoundHistory");
  const orderedPlayers = [...players].toSorted((left, right) => left.seatIndex - right.seatIndex);

  if (history.length === 0) {
    return (
      <section className="space-y-2 px-5 py-4">
        <div>
          <p className="text-foreground text-sm font-medium">{t("title")}</p>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
        <div className="bg-muted/40 text-muted-foreground rounded-2xl border px-4 py-6 text-sm">
          {t("empty")}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 px-5 py-4">
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">{t("title")}</p>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <div
        data-testid="round-history-scroll"
        className="overflow-x-auto rounded-2xl border border-dashed"
      >
        <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-muted/35">
              <th className="bg-background sticky left-0 z-20 min-w-40 border-b px-4 py-3 text-xs font-medium tracking-wide uppercase">
                {t("playerColumn")}
              </th>
              {history.map((entry) => (
                <th
                  key={`${entry.phase}-${entry.roundNumber}`}
                  className={cn(
                    "min-w-40 border-b px-4 py-3 text-xs font-medium tracking-wide uppercase",
                    entry.phase === "projected" && "bg-primary/5 border-dashed",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {entry.phase === "projected"
                        ? t("roundHeaderLive", { round: entry.roundNumber })
                        : t("roundHeader", { round: entry.roundNumber })}
                    </span>
                    {entry.phase === "projected" ? (
                      <span className="text-primary rounded-full border border-dashed px-2 py-0.5 text-[0.65rem] font-semibold normal-case">
                        {t("liveBadge")}
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
                <th className="bg-background sticky left-0 z-10 border-b px-4 py-4">
                  <div className="text-foreground text-sm font-medium">{player.displayName}</div>
                  <div className="text-muted-foreground text-xs">
                    {t("seatLabel", { seat: player.seatIndex + 1 })}
                  </div>
                </th>
                {history.map((entry) => {
                  const score = entry.scores.find(
                    (candidate) => candidate.playerId === player.playerId,
                  );
                  if (!score) {
                    return null;
                  }

                  return (
                    <td
                      key={`${entry.phase}-${entry.roundNumber}-${player.playerId}`}
                      className={cn(
                        "border-b px-4 py-4",
                        entry.phase === "projected" && "bg-primary/5 border-dashed",
                        score.reachedTarget && "bg-emerald-500/10",
                      )}
                    >
                      <div className="flex min-h-20 flex-col gap-1.5">
                        <div className="text-foreground text-lg font-semibold tabular-nums">
                          {score.totalScore}
                        </div>
                        <div className="text-muted-foreground text-sm tabular-nums">
                          +{score.roundScore}
                          <span className="sr-only">
                            {" "}
                            {t("gainLabel", { gain: score.roundScore })}
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
                            ? t("winner")
                            : t("pointsToTarget", { points: score.pointsToTarget })}
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
