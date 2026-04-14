import { GamePageClient } from "@/game/screens/game-page-client";
import type { Id } from "@/convex/_generated/dataModel";

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  const { matchId } = await params;

  return <GamePageClient matchId={matchId as Id<"matches">} />;
}
