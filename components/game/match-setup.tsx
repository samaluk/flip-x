"use client";

import { useMutation } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="hostName" className="text-sm font-medium text-zinc-300">
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
            className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600 transition-all"
          />
        </div>

        <div className="mt-2">
          <Dialog>
            <DialogTrigger render={
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors justify-start w-full">
                <SparklesIcon className="mr-2 h-4 w-4" />
                Rules help
              </Button>
            } />
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-medium">How this table plays Flip 7</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Hit to reveal another card, stay to bank what you have, and avoid duplicate
                  numbers unless a Second Chance saves you.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 text-sm text-zinc-300 mt-4">
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-100">1</span>
                  <span>Seven unique number cards ends the round immediately with a Flip 7 bonus.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-100">2</span>
                  <span>Freeze banks a player&apos;s current total. Flip Three forces three more cards.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-100">3</span>
                  <span>Second Chance discards one future duplicate instead of busting the player.</span>
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Alert className="mt-2 border-zinc-800 bg-zinc-900/30 text-zinc-300">
        <AlertTitle className="text-zinc-100 font-medium">Shared table note</AlertTitle>
        <AlertDescription className="text-zinc-400 mt-1">
          Share the match URL after setup. Each player enters their own name when joining, and
          refresh reconnects to the latest committed turn.
        </AlertDescription>
      </Alert>
      <div className="pt-2">
        <button
          type="submit"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "w-full sm:w-auto bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] transition-all font-medium px-8",
          )}
          disabled={isSubmitting || !hostName.trim() || !sessionId}
        >
          {joinCode ? "Join Lobby" : "Create Lobby"}
        </button>
      </div>
    </form>
  );
}