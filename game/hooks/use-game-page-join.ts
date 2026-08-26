"use client";

import { useSessionId } from "convex-helpers/react/sessions";
import * as Either from "effect/Either";
import { useExtracted } from "next-intl";
import { type SubmitEvent, useActionState, useState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { matchIdFromConfectWire } from "@/confect/lib/convex-id-bridge";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { resolvePlayerColorId } from "@/shared/lib/player-local-prefs";
import { usePlayerLocalPrefs } from "@/shared/lib/use-player-local-prefs";
import type { PlayerColorId } from "@/shared/lib/player-colors";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { toastEitherMutationFailure } from "@/shared/lib/either-mutation-toast";
import {
  getTrimmedPlayerNameIssue,
  type TrimmedPlayerNameIssue,
} from "@/shared/lib/player-name-validation";

function useGamePlayerNameIssueToast() {
  const t = useExtracted("Game");

  return (issue: TrimmedPlayerNameIssue) => {
    switch (issue) {
      case "empty":
        return t("Please enter your name.");
      case "too_long":
        return t("Name must be 20 characters or less.");
      case "no_session":
        return t("Session not available.");
      default: {
        const exhaustiveCheck: never = issue;
        return exhaustiveCheck;
      }
    }
  };
}

export function useGamePageJoin(matchId: string, players: MatchSnapshot["players"] | undefined) {
  const matchIdConvex = matchIdFromConfectWire(matchId);
  const [sessionId] = useSessionId();
  const joinMatch = useSessionConfectMutation(refs.public.matches.joinMatch);
  const [playerName, setPlayerName] = useState("");
  const { colorId, setColorId } = usePlayerLocalPrefs();
  const t = useExtracted("Game");
  const tErrors = useExtracted("Errors");
  const getPlayerNameIssueToast = useGamePlayerNameIssueToast();
  const usedColorIds =
    players
      ?.map((player) => player.colorId)
      .filter((playerColorId): playerColorId is string => typeof playerColorId === "string") ?? [];
  const selectedColorId = resolvePlayerColorId(colorId, usedColorIds);

  const [, submitJoin, isJoining] = useActionState(async () => {
    const trimmedName = playerName.trim();
    const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
    if (nameIssue) {
      toast.error(getPlayerNameIssueToast(nameIssue));
      return null;
    }

    const result = await toastEitherMutationFailure(
      joinMatch({
        matchId: matchIdConvex,
        playerName: trimmedName,
        playerColorId: selectedColorId,
      }),
      {
        missingMessage: t("Could not join the game."),
        tErrors,
      },
    );
    if (!result || Either.isLeft(result)) {
      return null;
    }

    setColorId(selectedColorId);
    setPlayerName("");
    return null;
  }, null);

  function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    submitJoin();
  }

  return {
    handleJoin,
    isJoining,
    playerName,
    selectedColorId,
    setColorId,
    setPlayerName,
    usedColorIds,
  } satisfies {
    handleJoin: (event: SubmitEvent<HTMLFormElement>) => void;
    isJoining: boolean;
    playerName: string;
    selectedColorId: PlayerColorId;
    setColorId: (colorId: PlayerColorId) => void;
    setPlayerName: (value: string) => void;
    usedColorIds: string[];
  };
}
