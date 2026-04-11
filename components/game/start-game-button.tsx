"use client";

import { motion } from "motion/react";
import { useMutation } from "convex/react";
import { PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { translateConvexError } from "@/lib/convex-error";

interface StartGameButtonProps {
  matchId: string;
  sessionId: string | null;
  isHost: boolean;
  playerCount: number;
}

export function StartGameButton({ matchId, sessionId, isHost, playerCount }: StartGameButtonProps) {
  const router = useRouter();
  const startMatch = useMutation(api.matches.startMatch);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("StartGameButton");
  const tErrors = useTranslations("Errors");

  async function handleStart() {
    if (!sessionId) {
      toast.error(t("toastClaimSeat"));
      return;
    }

    setIsSubmitting(true);
    try {
      await startMatch({
        matchId: matchId as Id<"matches">,
        sessionId,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!sessionId || !isHost) {
    return null;
  }

  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Button
        onClick={handleStart}
        disabled={isSubmitting || playerCount < 3}
        size="lg"
        className="gap-2 rounded-full px-6"
      >
        <PlayIcon className="h-4 w-4" />
        {isSubmitting ? t("starting") : t("startGame")}
      </Button>
    </motion.div>
  );
}
