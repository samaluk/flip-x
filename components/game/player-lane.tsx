"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Flip7Card } from "@/components/game/flip7-card";
import { cn } from "@/lib/utils";
import type { MatchSnapshot } from "@/lib/game/view-models";

function statusCopy(status: MatchSnapshot["players"][number]["roundStatus"]) {
  switch (status) {
    case "active":
      return "In the round";
    case "busted":
      return "Busted";
    case "stayed":
      return "Banked";
    case "frozen":
      return "Frozen";
    case "completed":
      return "Scored";
    default:
      return "Waiting";
  }
}

export function PlayerLane({
  player,
  isActive,
  isDealer = false,
  isViewer = false,
  isPinned = false,
  compact = false,
}: {
  player: MatchSnapshot["players"][number];
  isActive: boolean;
  isDealer?: boolean;
  isViewer?: boolean;
  isPinned?: boolean;
  compact?: boolean;
}) {
  const previousCardIds = useRef<string[]>([]);
  const previousStatus = useRef(player.roundStatus);
  const [dealingIds, setDealingIds] = useState<string[]>([]);
  const [stateAnimation, setStateAnimation] = useState<"bust" | "stay" | null>(null);

  const cardIds = useMemo(
    () => [
      ...player.modifierCards.map((card) => card.id),
      ...player.numberCards.map((card) => card.id),
      ...player.heldActionCards.map(
        (card) => `${player.playerId}-${card.actionKind}-${card.label}`,
      ),
    ],
    [player.heldActionCards, player.modifierCards, player.numberCards, player.playerId],
  );

  useEffect(() => {
    const newIds = cardIds.filter((id) => !previousCardIds.current.includes(id));

    if (newIds.length > 0) {
      setDealingIds(newIds);
      const timeout = window.setTimeout(() => setDealingIds([]), 750);
      previousCardIds.current = cardIds;
      return () => window.clearTimeout(timeout);
    }

    previousCardIds.current = cardIds;
  }, [cardIds]);

  useEffect(() => {
    if (previousStatus.current === player.roundStatus) {
      return;
    }

    if (player.roundStatus === "busted") {
      setStateAnimation("bust");
    } else if (player.roundStatus === "stayed" || player.roundStatus === "frozen") {
      setStateAnimation("stay");
    }

    previousStatus.current = player.roundStatus;

    if (
      player.roundStatus === "busted" ||
      player.roundStatus === "stayed" ||
      player.roundStatus === "frozen"
    ) {
      const timeout = window.setTimeout(() => setStateAnimation(null), 900);
      return () => window.clearTimeout(timeout);
    }
  }, [player.roundStatus]);

  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,28,41,0.92)_0%,rgba(8,18,28,0.96)_100%)] text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
        isActive && "ring-2 ring-[#f3d48a]/80 ring-offset-2 ring-offset-[#0e2233]",
        isDealer && "border-[#f3d48a]/40",
        isPinned && "border-emerald-400/50 bg-[linear-gradient(180deg,rgba(16,48,35,0.95)_0%,rgba(10,30,22,0.98)_100%)] shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg tracking-[0.08em] uppercase text-[#f8ead0]">
              {player.displayName}
            </h3>
            <div className="rounded-full border border-[#f3d48a]/35 bg-[#f3d48a]/10 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#f3d48a]">
              Seat {player.seatIndex + 1}
            </div>
            {isDealer ? (
              <div className="rounded-full border border-[#f3d48a]/35 bg-[#f3d48a]/10 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#f3d48a]">
                Dealer
              </div>
            ) : null}
            {isViewer ? (
              <div className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.2em] uppercase text-emerald-300">
                You
              </div>
            ) : null}
            {player.isClaimed && !isViewer ? (
              <div className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#cfd9df]">
                Claimed
              </div>
            ) : null}
          </div>
          <div className="text-sm text-[#cfd9df]">Total score {player.totalScore}</div>
        </div>

        {!compact && (
          <div className="grid min-w-[10rem] gap-1 text-right text-sm">
            <div className="font-heading text-[0.72rem] tracking-[0.24em] uppercase text-[#8cb1c4]">
              {statusCopy(player.roundStatus)}
            </div>
            <div className="text-2xl font-semibold text-[#fff5d7]">{player.pointsAtRisk}</div>
            <div className="text-xs tracking-[0.18em] uppercase text-[#8cb1c4]">Points at risk</div>
          </div>
        )}
      </div>

      <div className={cn("mt-3 flex flex-wrap gap-3", compact ? "gap-2" : "gap-4")}>
        {player.modifierCards.map((card) => (
          <Flip7Card key={card.id} kind="modifier" label={card.label} dealing={dealingIds.includes(card.id)} stateAnimation={stateAnimation} />
        ))}

        {player.numberCards.map((card) => (
          <Flip7Card key={card.id} kind="number" numberValue={card.numberValue} label={card.label} dealing={dealingIds.includes(card.id)} stateAnimation={stateAnimation} />
        ))}

        {player.heldActionCards.map((card) => {
          const key = `${player.playerId}-${card.actionKind}-${card.label}`;
          return <Flip7Card key={key} kind="action" actionKind={card.actionKind} label={card.label} dealing={dealingIds.includes(key)} stateAnimation={stateAnimation} />;
        })}
      </div>
    </section>
  );
}
