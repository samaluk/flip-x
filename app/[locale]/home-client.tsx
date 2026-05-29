"use client";

import { parseAsString, useQueryState } from "nuqs";
import { QueryResult, useQuery as useConfectQuery } from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useTranslations } from "next-intl";
import { startTransition, type SubmitEvent, useState } from "react";
import { toast } from "sonner";

import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import { firstAvailablePlayerColorId, type PlayerColorId } from "@/shared/lib/player-colors";
import {
  readStoredPlayerColorId,
  readStoredPlayerName,
  writeStoredPlayerColorId,
  writeStoredPlayerName,
} from "@/shared/lib/player-local-prefs";
import {
  getTrimmedPlayerNameIssue,
  PLAYER_NAME_ISSUE_TOAST_KEY,
} from "@/shared/lib/player-name-validation";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateConvexErrorToast } from "@/shared/lib/convex-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useRouter } from "@/shared/i18n/navigation";
import refs from "@/confect/_generated/refs";

const NO_USED_COLORS: readonly string[] = [];

type LobbyJoinMutationArgs = {
  joinByCode: (input: { lobbyCode: string }) => Promise<{ matchId: string }>;
  joinMatch: (input: {
    matchId: string;
    playerName: string;
    playerColorId: PlayerColorId;
  }) => Promise<unknown>;
  lobbyCode: string;
  playerName: string;
  colorId: PlayerColorId;
};

async function performLobbyJoin(args: LobbyJoinMutationArgs) {
  const { joinByCode, joinMatch, lobbyCode, playerName, colorId } = args;
  const result = await joinByCode({ lobbyCode: lobbyCode.toUpperCase() });
  await joinMatch({
    matchId: result.matchId,
    playerName,
    playerColorId: colorId,
  });
  return result;
}

export function HomeClient() {
  const { push } = useRouter();
  const [sessionId] = useSessionId();
  const [name, setName] = useState(readStoredPlayerName);
  const [colorId, setColorId] = useState<PlayerColorId>(readStoredPlayerColorId);
  const [joinCode, setJoinCode] = useQueryState("code", {
    ...parseAsString,
    parse: (value) => value.toUpperCase(),
    serialize: (value) => value.toUpperCase(),
  });
  const [hasOpenedJoinFlow, setHasOpenedJoinFlow] = useState(!!joinCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isJoinMode = Boolean(joinCode) || hasOpenedJoinFlow;

  const t = useTranslations("MatchSetup");
  const tErrors = useTranslations("Errors");
  const tLobby = useTranslations("Lobby");

  const createMatch = useSessionConfectMutation(refs.public.matches.createMatch);
  const joinByCode = useSessionConfectMutation(refs.public.matches.joinByCode);
  const joinMatch = useSessionConfectMutation(refs.public.matches.joinMatch);
  const lobbyLookupResult = useConfectQuery(
    refs.public.matches.getMatchByCode,
    joinCode && joinCode.length === 4 ? { lobbyCode: joinCode } : "skip",
  );
  const usedColorIds = QueryResult.match(lobbyLookupResult, {
    onLoading: () => NO_USED_COLORS,
    onSuccess: (lookup) => lookup?.usedColorIds ?? NO_USED_COLORS,
  });
  const selectedColorId = usedColorIds.includes(colorId)
    ? firstAvailablePlayerColorId(usedColorIds)
    : colorId;

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    writeStoredPlayerName(trimmedName);
    writeStoredPlayerColorId(selectedColorId);

    const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
    if (nameIssue) {
      toast.error(t(PLAYER_NAME_ISSUE_TOAST_KEY[nameIssue]));
      return;
    }

    setIsSubmitting(true);

    try {
      const match = await createMatch({
        hostName: trimmedName,
        hostColorId: selectedColorId,
      });

      startTransition(() => {
        push(`/game/${match.matchId}`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexErrorToast(message, tErrors) : t("toastCreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const playerName = name.trim();
    const lobbyCode = (joinCode ?? "").trim();

    writeStoredPlayerName(playerName);
    writeStoredPlayerColorId(selectedColorId);

    const nameIssue = getTrimmedPlayerNameIssue(playerName, sessionId);
    if (nameIssue) {
      toast.error(t(PLAYER_NAME_ISSUE_TOAST_KEY[nameIssue]));
      return;
    }

    if (lobbyCode.length !== 4) {
      toast.error(t("toastCodeLength"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await performLobbyJoin({
        joinByCode,
        joinMatch,
        lobbyCode,
        playerName,
        colorId: selectedColorId,
      });
      startTransition(() => {
        push(`/game/${result.matchId}`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexErrorToast(message, tErrors) : t("toastJoinFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-medium tracking-tighter text-foreground">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isJoinMode ? t("subtitleJoin") : t("subtitleCreate")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="playerName" className="text-sm font-medium text-foreground">
              {t("yourName")}
            </label>
            <Input
              id="playerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={20}
              className="h-12"
            />
          </div>

          <PlayerColorPicker
            value={selectedColorId}
            onChange={setColorId}
            usedColorIds={isJoinMode ? usedColorIds : []}
            label={t("playerColor")}
          />

          {!isJoinMode ? (
            <div className="space-y-6">
              <form onSubmit={(event) => void handleCreate(event)}>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full text-base font-medium"
                  disabled={isSubmitting || !name.trim() || !sessionId}
                >
                  {t("createNewGame")}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("or")}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full text-base"
                onClick={() => setHasOpenedJoinFlow(true)}
              >
                {t("joinExistingGame")}
              </Button>
            </div>
          ) : (
            <form onSubmit={(event) => void handleJoin(event)} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="joinCode" className="text-sm font-medium text-foreground">
                  {tLobby("lobbyCode")}
                </label>
                <Input
                  id="joinCode"
                  value={joinCode ?? ""}
                  onChange={(e) => {
                    void setJoinCode(e.target.value.toUpperCase());
                  }}
                  placeholder={tLobby("codePlaceholder")}
                  maxLength={4}
                  className="h-12 text-center font-mono text-2xl tracking-widest uppercase"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 flex-1"
                  onClick={() => {
                    setHasOpenedJoinFlow(false);
                    void setJoinCode(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 flex-1 text-base font-medium"
                  disabled={
                    isSubmitting || !name.trim() || (joinCode?.length ?? 0) !== 4 || !sessionId
                  }
                >
                  {t("joinGame")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
