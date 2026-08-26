"use client";

import { useExtracted } from "next-intl";

import type { MatchSnapshot } from "@/game/logic/view-models";

export function ScoreSummary({ players }: { players: MatchSnapshot["players"] }) {
  const t = useExtracted("ScoreSummary");

  return (
    <section className="overflow-hidden rounded-2xl p-5 text-card-foreground">
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-2xl text-start">
          <thead>
            <tr className="border-b border-border text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5">{t("Player")}</th>
              <th className="px-3 py-2.5">{t("Numbers")}</th>
              <th className="px-3 py-2.5">{t("×2")}</th>
              <th className="px-3 py-2.5">{t("Bonus")}</th>
              <th className="px-3 py-2.5">{t("flip-x")}</th>
              <th className="px-3 py-2.5">{t("Round total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {players.map((player) => (
              <tr key={player.playerId} className="text-sm text-foreground">
                <td className="p-3 font-medium">{player.displayName}</td>
                <td className="p-3 text-muted-foreground tabular-nums">
                  {player.scoreBreakdown.numberCardTotal}
                </td>
                <td className="p-3 text-muted-foreground">
                  {player.scoreBreakdown.multiplierApplied ? t("Yes") : t("No")}
                  <span className="sr-only">
                    {player.scoreBreakdown.multiplierApplied
                      ? t("Multiplier: ×2")
                      : t("Multiplier: none")}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground tabular-nums">
                  {player.scoreBreakdown.additiveModifierTotal}
                </td>
                <td className="p-3 text-muted-foreground tabular-nums">
                  {player.scoreBreakdown.flip7Bonus}
                </td>
                <td className="p-3 text-base font-semibold text-primary tabular-nums">
                  {player.scoreBreakdown.finalRoundScore}
                  <span className="sr-only">
                    {t("Final round score: {score}", {
                      score: String(player.scoreBreakdown.finalRoundScore),
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
