"use client";

import { useMutation } from "convex/react";
import { CheckIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-zinc-50 ring-0">
          <CardHeader>
            <CardTitle className="text-3xl">Flip 7, fully scored and fully shared</CardTitle>
            <CardDescription className="max-w-2xl text-zinc-300">
              Start a shared-table match that handles dealing, action cards, score modifiers, and
              the race to 200 without a paper score sheet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              "Live turn order and active-player focus",
              "Official action-card and modifier resolution",
              "Score breakdowns players can verify at a glance",
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
              >
                {feature}
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-none bg-transparent px-4 pt-0 text-zinc-300">
            Designed for 3 to 8 players, desktop to mobile, with one shared source of truth.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{joinCode ? "Join Lobby" : "Create a match"}</CardTitle>
            <CardDescription>
              {joinCode
                ? "Enter your name to join this lobby."
                : "Add three to eight players to create a lobby."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="flex flex-col gap-3">
              {playerNames.map((player, index) => (
                <div key={player.id} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={selectedSeatIndex === index ? "default" : "outline"}
                    onClick={() => setSelectedSeatIndex(index)}
                    className="min-w-24"
                  >
                    {selectedSeatIndex === index ? <CheckIcon /> : null}
                    {selectedSeatIndex === index ? "You" : "Claim me"}
                  </Button>
                  <Input
                    name={`player-${index}`}
                    defaultValue={player.name}
                    onChange={(event) => updateName(index, event.target.value)}
                    placeholder={`Player ${index + 1}`}
                    aria-label={`Player ${index + 1} name`}
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPlayer}
                  disabled={playerNames.length >= 8}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add player
                </Button>
                <Dialog>
                  <DialogTrigger render={<Button type="button" variant="ghost" />}>
                    <SparklesIcon data-icon="inline-start" />
                    Rules help
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>How this table plays Flip 7</DialogTitle>
                      <DialogDescription>
                        Hit to reveal another card, stay to bank what you have, and avoid duplicate
                        numbers unless a Second Chance saves you.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                      <p>
                        Seven unique number cards ends the round immediately with a Flip 7 bonus.
                      </p>
                      <p>
                        Freeze banks a player&apos;s current total. Flip Three forces three more
                        cards.
                      </p>
                      <p>
                        Second Chance discards one future duplicate instead of busting the player.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Alert>
                <AlertTitle>Shared table note</AlertTitle>
                <AlertDescription>
                  Share the match URL after setup. Each device claims one seat anonymously, and
                  refresh reconnects to the latest committed turn.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || playerNames.length < 3 || !sessionId}>
                {joinCode ? "Join Lobby" : "Create Lobby"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
