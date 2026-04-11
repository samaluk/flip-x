"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import type { MatchSnapshot } from "@/lib/game/view-models";

export function ScoreSummary({ players }: { players: MatchSnapshot["players"] }) {
  const t = useTranslations("ScoreSummary");

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
      className="game-score-summary surface-elevated overflow-hidden rounded-2xl bg-card p-5 text-card-foreground"
    >
      <div className="space-y-1">
        <h2 className="font-heading text-lg tracking-tight font-medium text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="game-score-summary-scroll mt-5 overflow-x-auto rounded-lg bg-card">
        <table className="w-full min-w-[42rem] text-left">
          <thead>
            <tr className="border-b border-border text-xs font-medium tracking-wide uppercase text-muted-foreground">
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
                <td className="px-3 py-3 tabular-nums text-muted-foreground">
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
                <td className="px-3 py-3 tabular-nums text-muted-foreground">
                  {player.scoreBreakdown.additiveModifierTotal}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">
                  {player.scoreBreakdown.flip7Bonus}
                </td>
                <td className="px-3 py-3 text-base font-semibold tabular-nums text-primary">
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
    </motion.section>
  );
}
