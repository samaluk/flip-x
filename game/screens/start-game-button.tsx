"use client";

import { LazyMotion, domAnimation, m } from "motion/react";
import { PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as Either from "effect/Either";
import { useState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { Button } from "@/shared/ui/button";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateAppErrorToast } from "@/shared/lib/convex-error";

interface StartGameButtonProps {
  matchId: string;
  version: number;
  isHost: boolean;
  playerCount: number;
}

export function StartGameButton({ matchId, version, isHost, playerCount }: StartGameButtonProps) {
  const startMatch = useSessionConfectMutation(refs.public.matches.startMatch);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("StartGameButton");
  const tErrors = useTranslations("Errors");

  async function handleStart() {
    setIsSubmitting(true);
    try {
      const result = await startMatch({
        matchId,
        expectedVersion: version,
        idempotencyKey: crypto.randomUUID(),
      });
      if (Either.isLeft(result)) {
        toast.error(translateAppErrorToast(result.left, tErrors));
      }
    } catch {
      toast.error(t("toastFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

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
          onClick={() => void handleStart()}
          disabled={isSubmitting || playerCount < 2}
          size="lg"
          className="gap-2 rounded-full px-6"
        >
          <PlayIcon className="size-4" />
          {isSubmitting ? t("starting") : t("startGame")}
        </Button>
      </m.div>
    </LazyMotion>
  );
}
