"use client";

import { useMutation } from "convex/react";
import { PlayIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

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

  async function handleStart() {
    if (!sessionId) {
      toast.error("You must claim a seat to start the game.");
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
      toast.error(error instanceof Error ? error.message : "Could not start the game.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!sessionId || !isHost) {
    return null;
  }

  return (
    <Button
      onClick={handleStart}
      disabled={isSubmitting || playerCount < 3}
      size="lg"
      className="gap-2"
    >
      <PlayIcon className="h-5 w-5" />
      {isSubmitting ? "Starting..." : "Start Game"}
    </Button>
  );
}
