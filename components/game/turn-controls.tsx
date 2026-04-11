"use client";

import { BanIcon, HandIcon, SparklesIcon, WandSparklesIcon } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MatchSnapshot } from "@/lib/game/view-models";

type PendingAction = NonNullable<MatchSnapshot["pendingAction"]>;

export function TurnControls({
  snapshot,
  onHit,
  onStay,
  onResolveAction,
  onStartNextRound,
}: {
  snapshot: MatchSnapshot;
  onHit: () => void;
  onStay: () => void;
  onResolveAction: (playerId: Id<"players">) => void;
  onStartNextRound: () => void;
}) {
  const activePlayer = snapshot.players.find(
    (player) => player.playerId === snapshot.activePlayerId,
  );
  const viewerControlsTurn = snapshot.viewerPlayerId === snapshot.activePlayerId;
  const viewerCanResolveAction = snapshot.pendingAction?.sourcePlayerId === snapshot.viewerPlayerId;

  if (snapshot.status === "completed") {
    return null;
  }

  if (snapshot.roundStatus === "completed") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onStartNextRound}
          disabled={!snapshot.viewerPlayerId}
          className="h-11 rounded-full bg-[#f3d48a] px-5 text-[#142230] hover:bg-[#f8e3aa]"
        >
          <SparklesIcon />
          Start next round
        </Button>
      </div>
    );
  }

  if (snapshot.pendingAction) {
    const pendingAction: PendingAction = snapshot.pendingAction;

    return (
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#f3d48a]/30 bg-[#081521]/70 p-4 text-white">
        <div className="space-y-1">
          <div className="font-heading text-[0.72rem] tracking-[0.24em] uppercase text-[#8cb1c4]">
            Action card in play
          </div>
          <div className="text-sm text-[#d9e5eb]">
            {pendingAction.actionKind === "freeze"
              ? "Choose who banks their points and freezes out of the round."
              : "Choose who must keep drawing until three cards resolve."}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {snapshot.players
            .filter((player) => pendingAction.eligibleTargetIds.includes(player.playerId))
            .map((player) => (
              <Button
                key={player.playerId}
                variant="outline"
                disabled={!viewerCanResolveAction}
                onClick={() => onResolveAction(player.playerId as Id<"players">)}
                className="h-10 rounded-full border-[#f3d48a]/35 bg-transparent px-4 text-[#f8ead0] hover:bg-[#f3d48a]/10"
              >
                <WandSparklesIcon />
                {player.displayName}
              </Button>
            ))}
        </div>
      </div>
    );
  }

  if (!activePlayer || snapshot.roundStatus !== "player_turns") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={onHit}
        disabled={!viewerControlsTurn}
        className={cn(
          "h-11 rounded-full px-5 text-[#142230] shadow-[0_14px_30px_rgba(243,212,138,0.24)]",
          "bg-[#f3d48a] hover:bg-[#f8e3aa]",
        )}
      >
        <HandIcon />
        Hit for {activePlayer.displayName}
      </Button>
      <Button
        variant="outline"
        onClick={onStay}
        disabled={!viewerControlsTurn}
        className="h-11 rounded-full border-[#8cb1c4]/45 bg-transparent px-5 text-[#d9e5eb] hover:bg-white/6 hover:text-white"
      >
        <BanIcon />
        Stay for {activePlayer.displayName}
      </Button>
      {!snapshot.viewerPlayerId ? (
        <div className="text-xs tracking-[0.18em] uppercase text-[#8cb1c4]">
          Claim a seat to play from this device.
        </div>
      ) : !viewerControlsTurn ? (
        <div className="text-xs tracking-[0.18em] uppercase text-[#8cb1c4]">
          Waiting for {activePlayer.displayName}.
        </div>
      ) : null}
    </div>
  );
}
