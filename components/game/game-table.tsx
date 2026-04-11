"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { GameTableView } from "@/components/game/game-table-view";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { translateConvexError } from "@/lib/convex-error";
import type { MatchSnapshot } from "@/lib/game/view-models";

export function GameTable({ snapshot, sessionId }: { snapshot: MatchSnapshot; sessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const takeTurn = useMutation(api.turns.takeTurn);
  const resolveAction = useMutation(api.turns.resolveAction);
  const startNextRound = useMutation(api.rounds.startNextRound);
  const tErrors = useTranslations("Errors");

  function runAction(action: () => Promise<unknown>) {
    startTransition(() => {
      action().catch((error) => {
        const message = error instanceof Error ? error.message : "";
        toast.error(
          message ? translateConvexError(message, tErrors) : tErrors("gameActionFailed"),
        );
      });
    });
  }

  return (
    <GameTableView
      snapshot={snapshot}
      isPending={isPending}
      onHit={() =>
        runAction(() =>
          takeTurn({
            matchId: snapshot.matchId as Id<"matches">,
            sessionId: sessionId,
            action: "hit",
          }),
        )
      }
      onStay={() =>
        runAction(() =>
          takeTurn({
            matchId: snapshot.matchId as Id<"matches">,
            sessionId: sessionId,
            action: "stay",
          }),
        )
      }
      onResolveAction={(targetPlayerId) =>
        runAction(() =>
          resolveAction({
            matchId: snapshot.matchId as Id<"matches">,
            sessionId: sessionId,
            targetPlayerId,
          }),
        )
      }
      onStartNextRound={() =>
        runAction(() =>
          startNextRound({
            matchId: snapshot.matchId as Id<"matches">,
            sessionId: sessionId,
          }),
        )
      }
    />
  );
}
