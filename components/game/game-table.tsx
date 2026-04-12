"use client";

import { useSessionMutation } from "convex-helpers/react/sessions";
import { useTranslations } from "next-intl";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

import { GameTableView } from "@/components/game/game-table-view";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { translateConvexError } from "@/lib/convex-error";
import type { MatchSnapshot } from "@/lib/game/view-models";

export function GameTable({ snapshot }: { snapshot: MatchSnapshot }) {
  const [isPending, startTransition] = useTransition();
  const takeTurn = useSessionMutation(api.turns.takeTurn);
  const resolveAction = useSessionMutation(api.turns.resolveAction);
  const startNextRound = useSessionMutation(api.rounds.startNextRound);
  const tErrors = useTranslations("Errors");
  const matchId = snapshot.matchId as Id<"matches">;

  const runAction = useCallback(
    (action: () => Promise<unknown>) => {
    startTransition(() => {
      action().catch((error) => {
        const message = error instanceof Error ? error.message : "";
        toast.error(message ? translateConvexError(message, tErrors) : tErrors("gameActionFailed"));
      });
    });
    },
    [tErrors],
  );

  const handleHit = useCallback(
    () =>
      runAction(() =>
        takeTurn({
          matchId,
          action: "hit",
        }),
      ),
    [matchId, runAction, takeTurn],
  );

  const handleStay = useCallback(
    () =>
      runAction(() =>
        takeTurn({
          matchId,
          action: "stay",
        }),
      ),
    [matchId, runAction, takeTurn],
  );

  const handleResolveAction = useCallback(
    (targetPlayerId: Id<"players">) =>
      runAction(() =>
        resolveAction({
          matchId,
          targetPlayerId,
        }),
      ),
    [matchId, resolveAction, runAction],
  );

  const handleStartNextRound = useCallback(
    () =>
      runAction(() =>
        startNextRound({
          matchId,
        }),
      ),
    [matchId, runAction, startNextRound],
  );

  return (
    <GameTableView
      snapshot={snapshot}
      isPending={isPending}
      onHit={handleHit}
      onStay={handleStay}
      onResolveAction={handleResolveAction}
      onStartNextRound={handleStartNextRound}
    />
  );
}
