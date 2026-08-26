import { parseAsString, useQueryState } from "nuqs";
import { QueryResult, useQuery as useConfectQuery } from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useExtracted } from "next-intl";
import { type SubmitEvent, startTransition, useState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { useAppErrors } from "@/shared/lib/errors/use-app-errors";
import { resolvePlayerColorId } from "@/shared/lib/player-local-prefs";
import type { TrimmedPlayerNameIssue } from "@/shared/lib/player-name-validation";
import { usePlayerLocalPrefs } from "@/shared/lib/use-player-local-prefs";
import { prefetchAndPushGameMatch } from "@/shared/i18n/match-navigation";
import { useRouter } from "@/shared/i18n/navigation";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { executeMatchSubmission, performHomeJoinByCode } from "./home-submission";

const NO_USED_COLORS: readonly string[] = [];

function useHomeLobbyState() {
  const [joinCode, setJoinCode] = useQueryState("code", {
    ...parseAsString,
    parse: (value) => value.toUpperCase(),
    serialize: (value) => value.toUpperCase(),
  });
  const [hasOpenedJoinFlow, setHasOpenedJoinFlow] = useState(!!joinCode);
  const lobbyLookupResult = useConfectQuery(
    refs.public.matches.getMatchByCode,
    joinCode && joinCode.length === 4 ? { lobbyCode: joinCode } : "skip",
  );
  const usedColorIds = QueryResult.match(lobbyLookupResult, {
    onLoading: () => NO_USED_COLORS,
    onSuccess: (lookup) => lookup?.usedColorIds ?? NO_USED_COLORS,
    onFailure: () => NO_USED_COLORS,
  });

  return {
    joinCode,
    setJoinCode,
    hasOpenedJoinFlow,
    setHasOpenedJoinFlow,
    isJoinMode: Boolean(joinCode) || hasOpenedJoinFlow,
    usedColorIds,
  };
}

function useHomeMutations() {
  const createMatch = useSessionConfectMutation(refs.public.matches.createMatch);
  const joinByCode = useSessionConfectMutation(refs.public.matches.joinByCode);
  const joinMatch = useSessionConfectMutation(refs.public.matches.joinMatch);

  return { createMatch, joinByCode, joinMatch };
}

function useMatchSetupPlayerNameIssueToast() {
  const t = useExtracted("MatchSetup");

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

function useHomeMatchSetupLabels() {
  const t = useExtracted("MatchSetup");
  const tLobby = useExtracted("Lobby");

  return {
    title: t("flip-x"),
    subtitleJoin: t("Enter your name and join the game"),
    subtitleCreate: t("Create a game or join an existing one"),
    yourName: t("Your name"),
    namePlaceholder: t("Enter your name"),
    playerColor: t("Player color"),
    createNewGame: t("Create New Game"),
    or: t("or"),
    joinExistingGame: t("Join Existing Game"),
    lobbyCode: tLobby("Lobby code"),
    codePlaceholder: tLobby("ABCD"),
    cancel: t("Cancel"),
    joinGame: t("Join Game"),
  };
}

export function useHomeMatchSetup() {
  const router = useRouter();
  const [sessionId] = useSessionId();
  const { name, setName, colorId, setColorId } = usePlayerLocalPrefs();
  const { joinCode, setJoinCode, isJoinMode, setHasOpenedJoinFlow, usedColorIds } =
    useHomeLobbyState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createMatch, joinByCode, joinMatch } = useHomeMutations();

  const t = useExtracted("MatchSetup");
  const { translateToast: translateError } = useAppErrors();
  const labels = useHomeMatchSetupLabels();
  const getPlayerNameIssueToast = useMatchSetupPlayerNameIssueToast();

  const selectedColorId = resolvePlayerColorId(colorId, usedColorIds);

  const navigateToMatch = (matchId: string) => {
    startTransition(() => {
      prefetchAndPushGameMatch(router, matchId);
    });
  };

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    await executeMatchSubmission({
      name,
      selectedColorId,
      sessionId,
      setName,
      setColorId,
      setIsSubmitting,
      getPlayerNameIssueToast,
      translateError,
      onSuccess: navigateToMatch,
      perform: (trimmedName) =>
        createMatch({
          hostName: trimmedName,
          hostColorId: selectedColorId,
        }),
      getFallbackErrorToast: () => t("Could not create the match."),
    });
  }

  async function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const lobbyCode = (joinCode ?? "").trim();
    if (lobbyCode.length !== 4) {
      toast.error(t("Please enter a 4-character code."));
      return;
    }

    await executeMatchSubmission({
      name,
      selectedColorId,
      sessionId,
      setName,
      setColorId,
      setIsSubmitting,
      getPlayerNameIssueToast,
      translateError,
      onSuccess: navigateToMatch,
      perform: (playerName) =>
        performHomeJoinByCode({
          joinByCode,
          joinMatch,
          lobbyCode,
          playerName,
          playerColorId: selectedColorId,
        }),
      getFallbackErrorToast: () => t("Could not join the game."),
    });
  }

  return {
    name,
    setName,
    joinCode,
    setJoinCode,
    isJoinMode,
    isSubmitting,
    selectedColorId,
    setColorId,
    usedColorIds,
    sessionId,
    setHasOpenedJoinFlow,
    handleCreate,
    handleJoin,
    labels,
  };
}
