"use client";

import { useTranslations } from "next-intl";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { GameTableView } from "@/game/screens/game-table-view";
import type { Id } from "@/convex/_generated/dataModel";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateConvexErrorToast } from "@/shared/lib/convex-error";
import type { MatchSnapshot } from "@/game/logic/view-models";

export function GameTable({ snapshot }: { snapshot: MatchSnapshot }) {
  const [isPending, startTransition] = useTransition();
  const takeTurn = useSessionConfectMutation(refs.public.turns.takeTurn).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(refs.public.matches.getMatchSnapshot, {
        matchId,
      });
      if (
        !current ||
        current.version !== args.expectedVersion ||
        !current.viewerPlayerId ||
        current.viewerPlayerId !== current.activePlayerId
      ) {
        return;
      }

      localStore.setQuery(
        refs.public.matches.getMatchSnapshot,
        { matchId },
        {
          ...current,
          optimisticTurn: {
            action: args.action,
            playerId: current.viewerPlayerId,
          },
        },
      );
    },
  );
  const resolveAction = useSessionConfectMutation(refs.public.turns.resolveAction);
  const startNextRound = useSessionConfectMutation(refs.public.rounds.startNextRound);
  const tErrors = useTranslations("Errors");
  const matchId = snapshot.matchId as Id<"matches">;

  const runAction = useCallback(
    (action: () => Promise<unknown>) => {
      startTransition(() => {
        action().catch((error) => {
          const message = error instanceof Error ? error.message : "";
          toast.error(
            message ? translateConvexErrorToast(message, tErrors) : tErrors("gameActionFailed"),
          );
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
          expectedVersion: snapshot.version,
          idempotencyKey: crypto.randomUUID(),
          action: "hit",
        }),
      ),
    [matchId, runAction, snapshot.version, takeTurn],
  );

  const handleStay = useCallback(
    () =>
      runAction(() =>
        takeTurn({
          matchId,
          expectedVersion: snapshot.version,
          idempotencyKey: crypto.randomUUID(),
          action: "stay",
        }),
      ),
    [matchId, runAction, snapshot.version, takeTurn],
  );

  const handleResolveAction = useCallback(
    (targetPlayerId: Id<"players">) =>
      runAction(() =>
        resolveAction({
          matchId,
          expectedVersion: snapshot.version,
          idempotencyKey: crypto.randomUUID(),
          targetPlayerId,
        }),
      ),
    [matchId, resolveAction, runAction, snapshot.version],
  );

  const handleStartNextRound = useCallback(
    () =>
      runAction(() =>
        startNextRound({
          matchId,
          expectedVersion: snapshot.version,
          idempotencyKey: crypto.randomUUID(),
        }),
      ),
    [matchId, runAction, snapshot.version, startNextRound],
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
