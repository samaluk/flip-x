import { GamePageClient } from "@/game/screens/game-page-client";

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  const { matchId } = await params;

  return <GamePageClient matchId={matchId} />;
}
