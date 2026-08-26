import type { Metadata } from "next";
import { Suspense } from "react";

import { GamePageClient } from "@/game/screens/game-page-client";
import { GamePageLoading } from "@/game/screens/game-page-loading";

export const metadata: Metadata = {
  title: "flip-x game",
  description: "Play flip-x with live turn tracking and scoring.",
};

export default function GamePage({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  return (
    <Suspense fallback={<GamePageLoading />}>
      <GamePageContent params={params} />
    </Suspense>
  );
}

async function GamePageContent({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  const { matchId } = await params;

  return <GamePageClient matchId={matchId} />;
}
