"use client";

import { useExtracted } from "next-intl";
import * as Either from "effect/Either";
import { useActionState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { GameTableView } from "@/game/screens/game-table-view";
import type { Id } from "@/convex/_generated/dataModel";
import {
  type SessionConfectOptimisticLocalStore,
  useSessionConfectMutation,
} from "@/shared/lib/confect-hooks";
import type { AppError } from "@/shared/lib/errors/domain";
import { translateAppErrorToast } from "@/shared/lib/convex-error";
import type { MatchSnapshot } from "@/game/logic/view-models";

type TakeTurnArgs = {
  matchId: string;
  expectedVersion: number;
  idempotencyKey: string;
  action: "hit" | "stay";
};

function canOptimisticallyMarkTurn(
  snapshot: MatchSnapshot | null | undefined,
  expectedVersion: number,
): snapshot is MatchSnapshot & { viewerPlayerId: Id<"players"> } {
  return (
    !!snapshot &&
    snapshot.version === expectedVersion &&
    !!snapshot.viewerPlayerId &&
    snapshot.viewerPlayerId === snapshot.activePlayerId
  );
}

function markOptimisticTurn(
  localStore: SessionConfectOptimisticLocalStore,
  matchId: Id<"matches">,
  args: TakeTurnArgs,
) {
  const current = localStore.getQuery(refs.public.matches.getMatchSnapshot, { matchId });

  if (!canOptimisticallyMarkTurn(current, args.expectedVersion)) {
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
}

const optimisticTakeTurn =
  (matchId: Id<"matches">) =>
  (localStore: SessionConfectOptimisticLocalStore, args: TakeTurnArgs) => {
    markOptimisticTurn(localStore, matchId, args);
  };

export function GameTable({ snapshot }: { snapshot: MatchSnapshot }) {
  const matchId = snapshot.matchId;
  const takeTurn = useSessionConfectMutation(refs.public.turns.takeTurn).withOptimisticUpdate(
    optimisticTakeTurn(matchId),
  );
  const resolveAction = useSessionConfectMutation(refs.public.turns.resolveAction);
  const startNextRound = useSessionConfectMutation(refs.public.rounds.startNextRound);
  const tErrors = useExtracted("Errors");

  const [, runAction, isPending] = useActionState<
    null,
    () => Promise<Either.Either<unknown, AppError>>
  >(async (_previousState: null, action) => {
    const result = await action().catch(() => null);
    if (!result) {
      toast.error(tErrors("Game action failed."));
      return null;
    }
    if (Either.isLeft(result)) {
      toast.error(translateAppErrorToast(result.left, tErrors));
    }
    return null;
  }, null);

  function handleHit() {
    runAction(() =>
      takeTurn({
        matchId,
        expectedVersion: snapshot.version,
        idempotencyKey: crypto.randomUUID(),
        action: "hit",
      }),
    );
  }

  function handleStay() {
    runAction(() =>
      takeTurn({
        matchId,
        expectedVersion: snapshot.version,
        idempotencyKey: crypto.randomUUID(),
        action: "stay",
      }),
    );
  }

  function handleResolveAction(targetPlayerId: Id<"players">) {
    runAction(() =>
      resolveAction({
        matchId,
        expectedVersion: snapshot.version,
        idempotencyKey: crypto.randomUUID(),
        targetPlayerId,
      }),
    );
  }

  function handleStartNextRound() {
    runAction(() =>
      startNextRound({
        matchId,
        expectedVersion: snapshot.version,
        idempotencyKey: crypto.randomUUID(),
      }),
    );
  }

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
