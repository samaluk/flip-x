"use client";

import { useSessionMutation } from "convex-helpers/react/sessions";
import { motion } from "motion/react";
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
  isHost: boolean;
  playerCount: number;
}

export function StartGameButton({ matchId, isHost, playerCount }: StartGameButtonProps) {
  const router = useRouter();
  const startMatch = useSessionMutation(api.matches.startMatch);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("StartGameButton");
  const tErrors = useTranslations("Errors");

  async function handleStart() {
    setIsSubmitting(true);
    try {
      await startMatch({
        matchId: matchId as Id<"matches">,
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

  if (!isHost) {
    return null;
  }

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Button
        onClick={handleStart}
        disabled={isSubmitting || playerCount < 2}
        size="lg"
        className="gap-2 rounded-full px-6"
      >
        <PlayIcon className="h-4 w-4" />
        {isSubmitting ? t("starting") : t("startGame")}
      </Button>
    </motion.div>
  );
}
