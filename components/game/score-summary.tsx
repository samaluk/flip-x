"use client";

import { motion } from "motion/react";

import type { MatchSnapshot } from "@/lib/game/view-models";

export function ScoreSummary({ players }: { players: MatchSnapshot["players"] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
      className="surface-elevated rounded-2xl p-5 text-card-foreground"
    >
      <div className="space-y-1">
        <h2 className="font-heading text-lg tracking-tight font-medium text-foreground">
          Round breakdown
        </h2>
        <p className="text-sm text-muted-foreground">
          Number totals, multiplier effects, bonus cards, and the final score each seat carries out
          of the round.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left">
          <thead>
            <tr className="border-b border-border text-xs font-medium tracking-wide uppercase text-muted-foreground">
              <th className="px-3 py-2.5">Player</th>
              <th className="px-3 py-2.5">Numbers</th>
              <th className="px-3 py-2.5">x2</th>
              <th className="px-3 py-2.5">Bonus</th>
              <th className="px-3 py-2.5">Flip 7</th>
              <th className="px-3 py-2.5">Round total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {players.map((player) => (
              <tr
                key={player.playerId}
                className="text-sm text-foreground"
              >
                <td className="px-3 py-3 font-medium">
                  {player.displayName}
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">{player.scoreBreakdown.numberCardTotal}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {player.scoreBreakdown.multiplierApplied ? "Yes" : "No"}
                  <span className="sr-only">
                    Multiplier: {player.scoreBreakdown.multiplierApplied ? "x2" : "none"}
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">{player.scoreBreakdown.additiveModifierTotal}</td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">{player.scoreBreakdown.flip7Bonus}</td>
                <td className="px-3 py-3 text-base font-semibold tabular-nums text-primary">
                  {player.scoreBreakdown.finalRoundScore}
                  <span className="sr-only">
                    Final round score: {player.scoreBreakdown.finalRoundScore}
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
