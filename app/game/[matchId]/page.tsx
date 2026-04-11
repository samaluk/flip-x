"use client";

import { useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { use, type FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GameTable } from "@/components/game/game-table";
import { LobbyCodeDisplay } from "@/components/game/lobby-code-display";
import { StartGameButton } from "@/components/game/start-game-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnonymousSessionId } from "@/lib/anonymous-session";

export default function GamePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const sessionId = useAnonymousSessionId();
  const joinMatch = useMutation(api.matches.joinMatch);
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const snapshot = useQuery(api.matches.getMatchSnapshot, {
    matchId: matchId as Id<"matches">,
    sessionId: sessionId || undefined,
  });

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const trimmedName = playerName.trim();
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

    setIsJoining(true);
    try {
      await joinMatch({
        matchId: matchId as Id<"matches">,
        playerName: trimmedName,
        sessionId,
      });
      setPlayerName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join the game.");
    } finally {
      setIsJoining(false);
    }
  }

  async function copyInviteLink() {
    try {
      const url = snapshot?.lobbyCode
        ? `${window.location.origin}?code=${snapshot.lobbyCode}`
        : window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy the invite link.");
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

  const isSetup = snapshot.status === "setup";
  const claimedCount = snapshot.players.filter((p) => p.isClaimed).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isSetup && snapshot.lobbyCode && <LobbyCodeDisplay code={snapshot.lobbyCode} />}
          {isSetup && (
            <StartGameButton
              matchId={matchId}
              sessionId={sessionId}
              isHost={snapshot.isHost ?? false}
              playerCount={claimedCount}
            />
          )}
        </div>
        <Button variant="outline" onClick={copyInviteLink}>
          <LinkIcon />
          Copy invite link
        </Button>
      </div>

      {!snapshot.viewerPlayerId && isSetup ? (
        <Card>
          <CardHeader>
            <CardTitle>Join the game</CardTitle>
            <CardDescription>
              Enter your name to claim a seat at the table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex gap-3">
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                className="max-w-xs bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
              <Button 
                type="submit" 
                disabled={isJoining || !playerName.trim()}
                className="bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] transition-all font-medium"
              >
                Join Game
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <GameTable snapshot={snapshot} sessionId={sessionId} />
    </main>
  );
}
