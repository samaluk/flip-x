"use client";

import { useSessionMutation } from "convex-helpers/react/sessions";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
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
            action: "hit",
          }),
        )
      }
      onStay={() =>
        runAction(() =>
          takeTurn({
            matchId: snapshot.matchId as Id<"matches">,
            action: "stay",
          }),
        )
      }
      onResolveAction={(targetPlayerId) =>
        runAction(() =>
          resolveAction({
            matchId: snapshot.matchId as Id<"matches">,
            targetPlayerId,
          }),
        )
      }
      onStartNextRound={() =>
        runAction(() =>
          startNextRound({
            matchId: snapshot.matchId as Id<"matches">,
          }),
        )
      }
    />
  );
}
