import { parseAsString, useQueryState } from "nuqs";
import { QueryResult, useQuery as useConfectQuery } from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useTranslations } from "next-intl";
import { type SubmitEvent, startTransition, useState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { resolvePlayerColorId } from "@/shared/lib/player-local-prefs";
import { usePlayerLocalPrefs } from "@/shared/lib/use-player-local-prefs";
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

export function useHomeMatchSetup() {
  const { push } = useRouter();
  const [sessionId] = useSessionId();
  const { name, setName, colorId, setColorId } = usePlayerLocalPrefs();
  const { joinCode, setJoinCode, isJoinMode, setHasOpenedJoinFlow, usedColorIds } =
    useHomeLobbyState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createMatch, joinByCode, joinMatch } = useHomeMutations();

  const t = useTranslations("MatchSetup");
  const tErrors = useTranslations("Errors");
  const tLobby = useTranslations("Lobby");

  const selectedColorId = resolvePlayerColorId(colorId, usedColorIds);

  const navigateToMatch = (matchId: string) => {
    startTransition(() => {
      push(`/game/${matchId}`);
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
      tSetup: t,
      tErrors,
      onSuccess: navigateToMatch,
      perform: (trimmedName) =>
        createMatch({
          hostName: trimmedName,
          hostColorId: selectedColorId,
        }),
      fallbackErrorKey: "toastCreateFailed",
    });
  }

  async function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const lobbyCode = (joinCode ?? "").trim();
    if (lobbyCode.length !== 4) {
      toast.error(t("toastCodeLength"));
      return;
    }

    await executeMatchSubmission({
      name,
      selectedColorId,
      sessionId,
      setName,
      setColorId,
      setIsSubmitting,
      tSetup: t,
      tErrors,
      onSuccess: navigateToMatch,
      perform: (playerName) =>
        performHomeJoinByCode({
          joinByCode,
          joinMatch,
          lobbyCode,
          playerName,
          playerColorId: selectedColorId,
        }),
      fallbackErrorKey: "toastJoinFailed",
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
    t,
    tLobby,
  };
}
