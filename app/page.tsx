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
      <div className="flex flex-1 items-center justify-center min-h-[100dvh]">
        <Skeleton className="h-40 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (codeParam && getMatchByCode) {
    return (
      <main className="flex flex-1 min-h-[100dvh] bg-zinc-950 text-zinc-50 selection:bg-zinc-800">
        <MatchSetup joinCode={codeParam} existingMatchId={getMatchByCode.matchId} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 min-h-[100dvh] items-center justify-center bg-zinc-950 text-zinc-50 selection:bg-zinc-800 relative overflow-hidden">
      {/* Ambient background noise/texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      {/* Subtle radial gradient for depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.04),_transparent_50%)]"></div>

      <div className="z-10 w-full max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-16 max-w-2xl">
          <h1 className="text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl md:text-6xl mb-6">
            Flip 7, fully scored<br />and fully shared.
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
            Start a shared-table match that handles dealing, action cards, score modifiers, and the race to 200 without a paper score sheet.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-start">
          <Card className="border-0 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <CardHeader className="pb-8 pt-8 px-8">
              <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">Create a match</CardTitle>
              <CardDescription className="text-zinc-400 text-base mt-2">
                Start a new lobby and invite friends to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <MatchSetup />
            </CardContent>
          </Card>

          <JoinLobbyDialog
            trigger={
              <Card className="cursor-pointer border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/40 active:scale-[0.98] group">
                <CardHeader className="pb-6 pt-8 px-8">
                  <CardTitle className="text-xl font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">Join an existing game</CardTitle>
                  <CardDescription className="text-zinc-500 mt-2">
                    Have a code? Enter it here to jump in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="inline-flex items-center justify-center rounded-lg bg-zinc-950/50 px-4 py-3 border border-zinc-800/50 font-mono text-xl tracking-[0.2em] text-zinc-500 group-hover:text-zinc-300 transition-colors shadow-inner">
                    ABCD
                  </div>
                </CardContent>
              </Card>
            }
          />
        </div>
      </div>
    </main>
  );
}
