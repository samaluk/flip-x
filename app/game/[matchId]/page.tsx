"use client";

import { useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { use } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GameTable } from "@/components/game/game-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnonymousSessionId } from "@/lib/anonymous-session";

export default function GamePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const sessionId = useAnonymousSessionId();
  const claimSeat = useMutation(api.matches.claimSeat);
  const snapshot = useQuery(api.matches.getMatchSnapshot, {
    matchId: matchId as Id<"matches">,
    sessionId: sessionId || undefined,
  });

  async function handleClaimSeat(playerId: string) {
    if (!sessionId) {
      return;
    }

    try {
      await claimSeat({
        matchId: matchId as Id<"matches">,
        playerId: playerId as Id<"players">,
        sessionId,
      });
      toast.success("Seat claimed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not claim that seat.");
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Match link copied.");
    } catch {
      toast.error("Could not copy the match link.");
    }
  }

  if (snapshot === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert>
          <AlertTitle>Match not found</AlertTitle>
          <AlertDescription>
            The requested match is unavailable or has not been created yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <Button variant="outline" onClick={copyInviteLink}>
          <LinkIcon />
          Copy invite link
        </Button>
      </div>

      {!snapshot.viewerPlayerId ? (
        <Card>
          <CardHeader>
            <CardTitle>Claim your seat</CardTitle>
            <CardDescription>
              Pick an open player seat on this device. No login is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshot.players.map((player) => (
              <Button
                key={player.playerId}
                variant={player.isClaimed ? "outline" : "default"}
                disabled={player.isClaimed || !sessionId}
                onClick={() => handleClaimSeat(player.playerId)}
                className="h-auto justify-between gap-3 px-4 py-4"
              >
                <span className="text-left">
                  <span className="block text-sm font-semibold">{player.displayName}</span>
                  <span className="block text-xs opacity-70">Seat {player.seatIndex + 1}</span>
                </span>
                <span className="text-xs uppercase tracking-[0.18em]">
                  {player.isClaimed ? "Claimed" : "Join"}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <GameTable snapshot={snapshot} sessionId={sessionId} />
    </main>
  );
}
