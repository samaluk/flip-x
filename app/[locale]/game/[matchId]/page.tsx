import type { Metadata } from "next";

import { GamePageClient } from "@/game/screens/game-page-client";

export const metadata: Metadata = {
  title: "flip-x game",
  description: "Play flip-x with live turn tracking and scoring.",
};

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  const { matchId } = await params;

  return <GamePageClient matchId={matchId} />;
}
