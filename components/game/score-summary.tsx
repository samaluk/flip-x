import type { MatchSnapshot } from "@/lib/game/view-models";

export function ScoreSummary({ players }: { players: MatchSnapshot["players"] }) {
  return (
    <section className="rounded-[2rem] border border-[#f3d48a]/16 bg-[linear-gradient(180deg,rgba(12,31,46,0.96)_0%,rgba(8,18,28,0.98)_100%)] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      <div className="space-y-1">
        <h2 className="font-heading text-xl tracking-[0.08em] uppercase text-[#f8ead0]">
          Round breakdown
        </h2>
        <p className="text-sm text-[#cfd9df]">
          Number totals, multiplier effects, bonus cards, and the final score each seat carries out
          of the round.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-[0.72rem] tracking-[0.24em] uppercase text-[#8cb1c4]">
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Numbers</th>
              <th className="px-3 py-2 font-medium">x2</th>
              <th className="px-3 py-2 font-medium">Bonus</th>
              <th className="px-3 py-2 font-medium">Flip 7</th>
              <th className="px-3 py-2 font-medium">Round total</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.playerId}
                className="overflow-hidden rounded-2xl bg-white/4 text-sm text-[#d9e5eb]"
              >
                <td className="rounded-l-2xl px-3 py-3 font-medium text-[#fff5d7]">
                  {player.displayName}
                </td>
                <td className="px-3 py-3">{player.scoreBreakdown.numberCardTotal}</td>
                <td className="px-3 py-3">
                  {player.scoreBreakdown.multiplierApplied ? "Yes" : "No"}
                  <span className="sr-only">
                    Multiplier: {player.scoreBreakdown.multiplierApplied ? "x2" : "none"}
                  </span>
                </td>
                <td className="px-3 py-3">{player.scoreBreakdown.additiveModifierTotal}</td>
                <td className="px-3 py-3">{player.scoreBreakdown.flip7Bonus}</td>
                <td className="rounded-r-2xl px-3 py-3 text-base font-semibold text-[#f3d48a]">
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
    </section>
  );
}
