"use client";

import { LazyMotion, domAnimation, m } from "motion/react";
import { PlayIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { useActionState } from "react";

import refs from "@/confect/_generated/refs";
import { Button } from "@/shared/ui/button";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { toastEitherMutationFailure } from "@/shared/lib/either-mutation-toast";
import { useTranslateAppErrorToast } from "@/shared/lib/use-translate-app-error-toast";

export interface StartGameButtonProps {
  matchId: string;
  version: number;
  isHost: boolean;
  playerCount: number;
}

export function StartGameButton({ matchId, version, isHost, playerCount }: StartGameButtonProps) {
  const startMatch = useSessionConfectMutation(refs.public.matches.startMatch);
  const t = useExtracted("StartGameButton");
  const translateError = useTranslateAppErrorToast();
  const [, startGame, isSubmitting] = useActionState(async () => {
    await toastEitherMutationFailure(
      startMatch({
        matchId,
        expectedVersion: version,
        idempotencyKey: crypto.randomUUID(),
      }),
      {
        missingMessage: t("Could not start the game."),
        translateError,
      },
    );
    return null;
  }, null);

  if (!isHost) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          onClick={() => startGame()}
          disabled={isSubmitting || playerCount < 2}
          size="lg"
          className="gap-2 rounded-full px-6"
        >
          <PlayIcon className="size-4" />
          {isSubmitting ? t("Starting...") : t("Start Game")}
        </Button>
      </m.div>
    </LazyMotion>
  );
}
