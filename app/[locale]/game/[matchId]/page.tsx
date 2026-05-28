import type { Metadata } from "next";

import { GamePageClient } from "@/game/screens/game-page-client";

export const metadata: Metadata = {
  title: "Flip 7 Game",
  description: "Play Flip 7 with live turn tracking and scoring.",
};

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  const { matchId } = await params;

  return <GamePageClient matchId={matchId} />;
}
