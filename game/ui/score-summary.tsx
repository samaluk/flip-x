"use client";

import { useTranslations } from "next-intl";

import type { MatchSnapshot } from "@/game/logic/view-models";

export function ScoreSummary({ players }: { players: MatchSnapshot["players"] }) {
  const t = useTranslations("ScoreSummary");

  return (
    <section className="overflow-hidden rounded-2xl p-5 text-card-foreground">
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-2xl text-left">
          <thead>
            <tr className="border-b border-border text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5">{t("colPlayer")}</th>
              <th className="px-3 py-2.5">{t("colNumbers")}</th>
              <th className="px-3 py-2.5">{t("colX2")}</th>
              <th className="px-3 py-2.5">{t("colBonus")}</th>
              <th className="px-3 py-2.5">{t("colFlip7")}</th>
              <th className="px-3 py-2.5">{t("colRoundTotal")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {players.map((player) => (
              <tr key={player.playerId} className="text-sm text-foreground">
                <td className="px-3 py-3 font-medium">{player.displayName}</td>
                <td className="px-3 py-3 text-muted-foreground tabular-nums">
                  {player.scoreBreakdown.numberCardTotal}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {player.scoreBreakdown.multiplierApplied ? t("yes") : t("no")}
                  <span className="sr-only">
                    {player.scoreBreakdown.multiplierApplied
                      ? t("srMultiplierApplied")
                      : t("srMultiplierOff")}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground tabular-nums">
                  {player.scoreBreakdown.additiveModifierTotal}
                </td>
                <td className="px-3 py-3 text-muted-foreground tabular-nums">
                  {player.scoreBreakdown.flip7Bonus}
                </td>
                <td className="px-3 py-3 text-base font-semibold text-primary tabular-nums">
                  {player.scoreBreakdown.finalRoundScore}
                  <span className="sr-only">
                    {t("srFinalScore", { score: player.scoreBreakdown.finalRoundScore })}
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
