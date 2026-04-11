"use client";

import { useMutation } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAnonymousSessionId } from "@/lib/anonymous-session";

interface MatchSetupProps {
  joinCode?: string;
  existingMatchId?: string;
}

export function MatchSetup({ joinCode, existingMatchId }: MatchSetupProps) {
  const router = useRouter();
  const sessionId = useAnonymousSessionId();
  const createMatch = useMutation(api.matches.createMatch);
  const [hostName, setHostName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitMatch(formData: FormData) {
    const name = formData.get("hostName") as string;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      toast.error("Please enter your name.");
      return;
    }

    if (trimmedName.length > 20) {
      toast.error("Name must be 20 characters or less.");
      return;
    }

    if (!sessionId) {
      toast.error("Session not available.");
      return;
    }

    setIsSubmitting(true);

    try {
      let targetMatchId = existingMatchId;

      if (!targetMatchId) {
        const match = await createMatch({
          hostName: trimmedName,
          sessionId,
        });
        targetMatchId = match.matchId;
      }

      if (targetMatchId) {
        startTransition(() => {
          router.push(`/game/${targetMatchId}`);
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the match.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMatch(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="hostName" className="text-sm font-medium text-foreground">
            Your name
          </label>
          <Input
            id="hostName"
            name="hostName"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            required
            className="transition-all"
          />
        </div>

        <div className="mt-1">
          <Dialog>
            <DialogTrigger render={
              <Button type="button" variant="ghost" className="justify-start w-full text-muted-foreground hover:text-foreground transition-colors">
                <SparklesIcon className="mr-2 h-4 w-4" />
                Rules help
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium">How this table plays Flip 7</DialogTitle>
                <DialogDescription>
                  Hit to reveal another card, stay to bank what you have, and avoid duplicate
                  numbers unless a Second Chance saves you.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 text-sm text-muted-foreground mt-4">
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">1</span>
                  <span>Seven unique number cards ends the round immediately with a Flip 7 bonus.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">2</span>
                  <span>Freeze banks a player&apos;s current total. Flip Three forces three more cards.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">3</span>
                  <span>Second Chance discards one future duplicate instead of busting the player.</span>
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Share the match URL after setup. Each player enters their own name when joining, and
        refresh reconnects to the latest committed turn.
      </p>

      <div>
        <button
          type="submit"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full sm:w-auto px-8 font-medium",
          )}
          disabled={isSubmitting || !hostName.trim() || !sessionId}
        >
          {joinCode ? "Join Lobby" : "Create Lobby"}
        </button>
      </div>
    </form>
  );
}
