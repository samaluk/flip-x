"use client";

import { QueryResult } from "@confect/react";
import { useExtracted } from "next-intl";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { matchIdFromConfectWire } from "@/confect/lib/convex-id-bridge";
import { useGamePageJoin } from "@/game/hooks/use-game-page-join";
import { useMatchPresence } from "@/game/hooks/use-match-presence";
import type { MatchSnapshot } from "@/game/logic/view-models";
import type { PlayerColorId } from "@/shared/lib/player-colors";
import { useAppErrors } from "@/shared/lib/errors/use-app-errors";
import { useSessionConfectQuery } from "@/shared/lib/confect-hooks";

export type GamePageState = {
  matchId: string;
  snapshot: MatchSnapshot | undefined;
  isLoading: boolean;
  isFailure: boolean;
  onlinePlayerIds: string[] | undefined;
  playerName: string;
  selectedColorId: PlayerColorId;
  usedColorIds: string[];
  isJoining: boolean;
  joinFormAction: () => void;
  onPlayerNameChange: (value: string) => void;
  onColorChange: (colorId: PlayerColorId) => void;
  onCopyInvite: () => void;
  matchNotFoundTitle: string;
  matchNotFoundBody: string;
};

// fallow-ignore-next-line complexity -- Convex query and session hooks are intentionally composed at this screen boundary; behavior is covered by the page integration flow.
export function useGamePageState(matchId: string): GamePageState {
  const matchIdConvex = matchIdFromConfectWire(matchId);
  const snapshotResult = useSessionConfectQuery(refs.public.matches.getMatchSnapshot, {
    matchId: matchIdConvex,
  });
  const snapshot = QueryResult.isSuccess(snapshotResult) ? snapshotResult.value : undefined;
  const t = useExtracted("Game");
  const { matchNotFoundTitle } = useAppErrors();
  const viewerPlayerId = snapshot?.viewerPlayerId;
  const onlinePlayerIds = useMatchPresence(matchId, viewerPlayerId ?? undefined);
  const {
    joinFormAction,
    isJoining,
    playerName,
    selectedColorId,
    setColorId,
    setPlayerName,
    usedColorIds,
  } = useGamePageJoin(matchId, snapshot?.players);

  const onCopyInvite = async () => {
    try {
      const url = snapshot?.lobbyCode
        ? `${window.location.origin}?code=${snapshot.lobbyCode}`
        : window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success(t("Invite link copied."));
    } catch {
      toast.error(t("Could not copy the invite link."));
    }
  };

  return {
    matchId,
    snapshot: snapshot ?? undefined,
    isLoading: QueryResult.isLoading(snapshotResult),
    isFailure: QueryResult.isFailure(snapshotResult),
    onlinePlayerIds,
    playerName,
    selectedColorId,
    usedColorIds,
    isJoining,
    joinFormAction,
    onPlayerNameChange: setPlayerName,
    onColorChange: setColorId,
    onCopyInvite: () => void onCopyInvite(),
    matchNotFoundTitle,
    matchNotFoundBody: t("The requested match is unavailable or has not been created yet."),
  };
}
