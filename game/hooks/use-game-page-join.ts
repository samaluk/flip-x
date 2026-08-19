"use client";

import { useSessionId } from "convex-helpers/react/sessions";
import * as Either from "effect/Either";
import { useTranslations } from "next-intl";
import { type SubmitEvent, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { matchIdFromConfectWire } from "@/confect/lib/convex-id-bridge";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { resolvePlayerColorId } from "@/shared/lib/player-local-prefs";
import { usePlayerLocalPrefs } from "@/shared/lib/use-player-local-prefs";
import type { PlayerColorId } from "@/shared/lib/player-colors";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateAppErrorToast } from "@/shared/lib/convex-error";
import {
  getTrimmedPlayerNameIssue,
  PLAYER_NAME_ISSUE_TOAST_KEY,
} from "@/shared/lib/player-name-validation";

export function useGamePageJoin(matchId: string, players: MatchSnapshot["players"] | undefined) {
  const matchIdConvex = matchIdFromConfectWire(matchId);
  const [sessionId] = useSessionId();
  const joinMatch = useSessionConfectMutation(refs.public.matches.joinMatch);
  const [playerName, setPlayerName] = useState("");
  const { colorId, setColorId } = usePlayerLocalPrefs();
  const [isJoining, setIsJoining] = useState(false);
  const t = useTranslations("Game");
  const tErrors = useTranslations("Errors");
  const usedColorIds = useMemo(
    () =>
      players
        ?.map((player) => player.colorId)
        .filter((playerColorId): playerColorId is string => typeof playerColorId === "string") ??
      [],
    [players],
  );
  const selectedColorId = resolvePlayerColorId(colorId, usedColorIds);

  const handleJoin = useCallback(
    async (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = playerName.trim();
      const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
      if (nameIssue) {
        toast.error(t(PLAYER_NAME_ISSUE_TOAST_KEY[nameIssue]));
        return;
      }

      setIsJoining(true);
      try {
        const result = await joinMatch({
          matchId: matchIdConvex,
          playerName: trimmedName,
          playerColorId: selectedColorId,
        });
        if (Either.isLeft(result)) {
          toast.error(translateAppErrorToast(result.left, tErrors));
          return;
        }
        setColorId(selectedColorId);
        setPlayerName("");
      } catch {
        toast.error(t("toastJoinFailed"));
      } finally {
        setIsJoining(false);
      }
    },
    [joinMatch, matchIdConvex, playerName, selectedColorId, sessionId, setColorId, t, tErrors],
  );

  return {
    handleJoin,
    isJoining,
    playerName,
    selectedColorId,
    setColorId,
    setPlayerName,
    usedColorIds,
  } satisfies {
    handleJoin: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
    isJoining: boolean;
    playerName: string;
    selectedColorId: PlayerColorId;
    setColorId: (colorId: PlayerColorId) => void;
    setPlayerName: (value: string) => void;
    usedColorIds: string[];
  };
}
