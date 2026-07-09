"use client";

import { parseAsString, useQueryState } from "nuqs";
import { QueryResult, useQuery as useConfectQuery } from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import * as Either from "effect/Either";
import { useTranslations } from "next-intl";
import { startTransition, type SubmitEvent, useState } from "react";
import { toast } from "sonner";

import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import { resolvePlayerColorId } from "@/shared/lib/player-local-prefs";
import { usePlayerLocalPrefs } from "@/shared/lib/use-player-local-prefs";
import {
  getTrimmedPlayerNameIssue,
  PLAYER_NAME_ISSUE_TOAST_KEY,
} from "@/shared/lib/player-name-validation";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateAppErrorToast } from "@/shared/lib/convex-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useRouter } from "@/shared/i18n/navigation";
import refs from "@/confect/_generated/refs";

const NO_USED_COLORS: readonly string[] = [];

export function HomeClient() {
  const { push } = useRouter();
  const [sessionId] = useSessionId();
  const { name, setName, colorId, setColorId } = usePlayerLocalPrefs();
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
    onFailure: () => NO_USED_COLORS,
  });
  const selectedColorId = resolvePlayerColorId(colorId, usedColorIds);

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    setName(trimmedName);
    setColorId(selectedColorId);

    const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
    if (nameIssue) {
      toast.error(t(PLAYER_NAME_ISSUE_TOAST_KEY[nameIssue]));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createMatch({
        hostName: trimmedName,
        hostColorId: selectedColorId,
      });
      if (Either.isLeft(result)) {
        toast.error(translateAppErrorToast(result.left, tErrors));
        return;
      }

      startTransition(() => {
        push(`/game/${result.right.matchId}`);
      });
    } catch {
      toast.error(t("toastCreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const playerName = name.trim();
    const lobbyCode = (joinCode ?? "").trim();

    setName(playerName);
    setColorId(selectedColorId);

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
      const lookup = await joinByCode({
        lobbyCode: lobbyCode.toUpperCase(),
      });
      if (Either.isLeft(lookup)) {
        toast.error(translateAppErrorToast(lookup.left, tErrors));
        return;
      }
      const joined = await joinMatch({
        matchId: lookup.right.matchId,
        playerName,
        playerColorId: selectedColorId,
      });
      if (Either.isLeft(joined)) {
        toast.error(translateAppErrorToast(joined.left, tErrors));
        return;
      }
      startTransition(() => {
        push(`/game/${lookup.right.matchId}`);
      });
    } catch {
      toast.error(t("toastJoinFailed"));
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
