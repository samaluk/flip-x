"use client";

import { useGamePageState } from "@/game/hooks/use-game-page-state";
import { GamePageContent, GamePageError } from "@/game/screens/game-page-content";
import { GamePageLoading } from "@/game/screens/game-page-loading";

export function GamePageClient({ matchId }: { matchId: string }) {
  const state = useGamePageState(matchId);

  if (state.isLoading) {
    return <GamePageLoading />;
  }
  if (state.isFailure) {
    return <GamePageError title={state.failureTitle} body={state.matchNotFoundBody} />;
  }
  if (!state.snapshot) {
    return <GamePageError title={state.matchNotFoundTitle} body={state.matchNotFoundBody} />;
  }

  const onlinePlayerIdSet = new Set(state.onlinePlayerIds);
  const snapshot = {
    ...state.snapshot,
    players: state.snapshot.players.map((player) => ({
      ...player,
      isOnline: onlinePlayerIdSet.has(player.playerId),
    })),
  };

  return <GamePageContent {...state} snapshot={snapshot} />;
}
