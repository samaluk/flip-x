"use client";

import { useTranslations } from "next-intl";

import type { MatchSnapshot } from "@/game/logic/view-models";

export function ScoreSummary({ players }: { players: MatchSnapshot["players"] }) {
  const t = useTranslations("ScoreSummary");

  return (
    <section className="game-score-summary surface-elevated bg-card text-card-foreground overflow-hidden rounded-2xl p-5">
      <div className="space-y-1">
        <h2 className="font-heading text-foreground text-lg font-medium tracking-tight">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <div className="game-score-summary-scroll bg-card mt-5 overflow-x-auto rounded-lg">
        <table className="w-full min-w-[42rem] text-left">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-xs font-medium tracking-wide uppercase">
              <th className="px-3 py-2.5">{t("colPlayer")}</th>
              <th className="px-3 py-2.5">{t("colNumbers")}</th>
              <th className="px-3 py-2.5">{t("colX2")}</th>
              <th className="px-3 py-2.5">{t("colBonus")}</th>
              <th className="px-3 py-2.5">{t("colFlip7")}</th>
              <th className="px-3 py-2.5">{t("colRoundTotal")}</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {players.map((player) => (
              <tr key={player.playerId} className="text-foreground text-sm">
                <td className="px-3 py-3 font-medium">{player.displayName}</td>
                <td className="text-muted-foreground px-3 py-3 tabular-nums">
                  {player.scoreBreakdown.numberCardTotal}
                </td>
                <td className="text-muted-foreground px-3 py-3">
                  {player.scoreBreakdown.multiplierApplied ? t("yes") : t("no")}
                  <span className="sr-only">
                    {player.scoreBreakdown.multiplierApplied
                      ? t("srMultiplierApplied")
                      : t("srMultiplierOff")}
                  </span>
                </td>
                <td className="text-muted-foreground px-3 py-3 tabular-nums">
                  {player.scoreBreakdown.additiveModifierTotal}
                </td>
                <td className="text-muted-foreground px-3 py-3 tabular-nums">
                  {player.scoreBreakdown.flip7Bonus}
                </td>
                <td className="text-primary px-3 py-3 text-base font-semibold tabular-nums">
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
