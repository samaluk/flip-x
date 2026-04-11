"use client";

import { useMutation } from "convex/react";
import { CheckIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { useAnonymousSessionId } from "@/lib/anonymous-session";
import { cn } from "@/lib/utils";

const DEFAULT_PLAYERS = ["Alex", "Blair", "Casey"].map((name, index) => ({
  id: `default-${index}`,
  name,
}));

interface MatchSetupProps {
  joinCode?: string;
  existingMatchId?: string;
}

export function MatchSetup({ joinCode, existingMatchId }: MatchSetupProps) {
  const router = useRouter();
  const sessionId = useAnonymousSessionId();
  const createMatch = useMutation(api.matches.createMatch);
  const claimSeat = useMutation(api.matches.claimSeat);
  const [playerNames, setPlayerNames] = useState(DEFAULT_PLAYERS);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateName(index: number, value: string) {
    setPlayerNames((current) =>
      current.map((player, currentIndex) =>
        currentIndex === index ? { ...player, name: value } : player,
      ),
    );
  }

  function addPlayer() {
    setPlayerNames((current) => [
      ...current,
      {
        id: `extra-${current.length + 1}`,
        name: `Player ${current.length + 1}`,
      },
    ]);
  }

  async function submitMatch(formData: FormData) {
    const names = playerNames.map((player, index) => {
      const value = formData.get(`player-${index}`);
      return typeof value === "string" ? value.trim() : player.name.trim();
    });

    setIsSubmitting(true);

    try {
      let targetMatchId = existingMatchId;

      if (!targetMatchId) {
        if (!sessionId) {
          throw new Error("Session not available.");
        }
        const match = await createMatch({ playerNames: names, sessionId });
        targetMatchId = match.matchId;
        const claimedPlayer = match.players[selectedSeatIndex];

        if (!claimedPlayer) {
          throw new Error("Could not create the match.");
        }

        await claimSeat({
          matchId: match.matchId as Id<"matches">,
          playerId: claimedPlayer.playerId as Id<"players">,
          sessionId,
        });
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
        {playerNames.map((player, index) => (
          <div key={player.id} className="flex items-center gap-3">
            <Button
              type="button"
              variant={selectedSeatIndex === index ? "default" : "outline"}
              onClick={() => setSelectedSeatIndex(index)}
              className={`min-w-28 transition-all duration-200 ${selectedSeatIndex === index ? 'shadow-[0_0_12px_rgba(255,255,255,0.2)]' : ''}`}
            >
              {selectedSeatIndex === index ? <CheckIcon className="mr-2 h-4 w-4" /> : null}
              {selectedSeatIndex === index ? "You" : "Claim me"}
            </Button>
            <Input
              name={`player-${index}`}
              defaultValue={player.name}
              onChange={(event) => updateName(index, event.target.value)}
              placeholder={`Player ${index + 1}`}
              aria-label={`Player ${index + 1} name`}
              className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600 transition-all"
            />
          </div>
        ))}
        <div className="flex gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={addPlayer}
            disabled={playerNames.length >= 8}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add player
          </Button>
          <Dialog>
            <DialogTrigger render={<Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors" />}>
              <SparklesIcon className="mr-2 h-4 w-4" />
              Rules help
            </DialogTrigger>
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
        <Alert className="mt-4 border-zinc-800 bg-zinc-900/30 text-zinc-300">
          <AlertTitle className="text-zinc-100 font-medium">Shared table note</AlertTitle>
          <AlertDescription className="text-zinc-400 mt-1">
            Share the match URL after setup. Each device claims one seat anonymously, and
            refresh reconnects to the latest committed turn.
          </AlertDescription>
        </Alert>
      </div>
      <div className="pt-2">
        <button
          type="submit"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "w-full sm:w-auto bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] transition-all font-medium px-8",
          )}
          disabled={isSubmitting || playerNames.length < 3 || !sessionId}
        >
          {joinCode ? "Join Lobby" : "Create Lobby"}
        </button>
      </div>
    </form>
  );
}
