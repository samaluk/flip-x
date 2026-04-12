"use client";

import { motion } from "motion/react";
import { BanIcon, HandIcon, SparklesIcon, WandSparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
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
  const t = useTranslations("TurnControls");
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
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Button
            onClick={onStartNextRound}
            disabled={!snapshot.viewerPlayerId}
            size="lg"
            className="rounded-full px-6"
          >
            <SparklesIcon />
            {t("startNextRound")}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (snapshot.pendingAction) {
    const pendingAction: PendingAction = snapshot.pendingAction;

    return (
      <div className="border-border bg-muted/30 flex flex-col gap-4 rounded-xl border p-4">
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t("actionCardTitle")}
          </div>
          <div className="text-foreground text-sm">
            {pendingAction.actionKind === "freeze" ? t("freezePrompt") : t("flipThreePrompt")}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {snapshot.players
            .filter((player) => pendingAction.eligibleTargetIds.includes(player.playerId))
            .map((player) => (
              <motion.div
                key={player.playerId}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button
                  variant="outline"
                  disabled={!viewerCanResolveAction}
                  onClick={() => onResolveAction(player.playerId as Id<"players">)}
                  className="rounded-full"
                >
                  <WandSparklesIcon />
                  {player.displayName}
                </Button>
              </motion.div>
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
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          onClick={onHit}
          disabled={!viewerControlsTurn}
          size="lg"
          className="rounded-full px-6"
        >
          <HandIcon />
          {t("hitFor", { name: activePlayer.displayName })}
        </Button>
      </motion.div>
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          variant="outline"
          onClick={onStay}
          disabled={!viewerControlsTurn}
          size="lg"
          className="rounded-full px-6"
        >
          <BanIcon />
          {t("stayFor", { name: activePlayer.displayName })}
        </Button>
      </motion.div>
      {!snapshot.viewerPlayerId ? (
        <div className="text-muted-foreground text-xs">{t("claimToPlay")}</div>
      ) : !viewerControlsTurn ? (
        <div className="text-muted-foreground text-xs">
          {t("waitingFor", { name: activePlayer.displayName })}
        </div>
      ) : null}
    </div>
  );
}
