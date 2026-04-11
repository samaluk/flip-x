"use client";

import { useQuery } from "convex/react";
import { use } from "react";

import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinLobbyDialog } from "@/components/game/join-lobby-dialog";
import { MatchSetup } from "@/components/game/match-setup";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = use(searchParams);
  const codeParam = code?.toUpperCase();
  const getMatchByCode = useQuery(api.matches.getMatchByCode, {
    lobbyCode: codeParam || "",
  });

  if (codeParam && !getMatchByCode) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  if (codeParam && getMatchByCode) {
    return (
      <main className="flex flex-1 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%),linear-gradient(180deg,_var(--background),_color-mix(in_oklab,_var(--background)_92%,_black)]">
        <MatchSetup joinCode={codeParam} existingMatchId={getMatchByCode.matchId} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%),linear-gradient(180deg,_var(--background),_color-mix(in_oklab,_var(--background)_92%,_black)]">
      <div className="grid w-full max-w-2xl gap-6 px-4 py-12 md:grid-cols-2">
        <Card className="border-none bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-zinc-50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create a Game</CardTitle>
            <CardDescription className="text-zinc-300">
              Start a new lobby and invite friends to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchSetup />
          </CardContent>
        </Card>

        <JoinLobbyDialog
          trigger={
            <Card className="cursor-pointer border-2 border-dashed border-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-2xl">Join a Game</CardTitle>
                <CardDescription className="text-zinc-400">
                  Enter a code to join an existing lobby.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-zinc-500">
                <span className="font-mono text-3xl tracking-widest">ABCD</span>
              </CardContent>
            </Card>
          }
        />
      </div>
    </main>
  );
}
