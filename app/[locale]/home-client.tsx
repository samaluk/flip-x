"use client";

import { parseAsString, useQueryState } from "nuqs";
import { QueryResult, useQuery as useConfectQuery } from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import * as Either from "effect/Either";
import { useTranslations } from "next-intl";
import { type FormEvent, startTransition, useState } from "react";
import { toast } from "sonner";

import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import { resolvePlayerColorId } from "@/shared/lib/player-local-prefs";
import { usePlayerLocalPrefs } from "@/shared/lib/use-player-local-prefs";
import { CreateForm } from "./create-form";
import { executeMatchSubmission } from "./home-submission";
import { JoinForm } from "./join-form";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
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
      onSuccess: (matchId) => {
        startTransition(() => {
          push(`/game/${matchId}`);
        });
      },
      perform: (trimmedName) =>
        createMatch({
          hostName: trimmedName,
          hostColorId: selectedColorId,
        }),
      fallbackErrorKey: "toastCreateFailed",
    });
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
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
      onSuccess: (matchId) => {
        startTransition(() => {
          push(`/game/${matchId}`);
        });
      },
      perform: async (playerName) => {
        const lookup = await joinByCode({
          lobbyCode: lobbyCode.toUpperCase(),
        });
        if (Either.isLeft(lookup)) {
          return lookup;
        }
        const joined = await joinMatch({
          matchId: lookup.right.matchId,
          playerName,
          playerColorId: selectedColorId,
        });
        if (Either.isLeft(joined)) {
          return joined;
        }
        return Either.right({ matchId: lookup.right.matchId });
      },
      fallbackErrorKey: "toastJoinFailed",
    });
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
            <CreateForm
              onSubmit={(event) => void handleCreate(event)}
              onOpenJoinFlow={() => setHasOpenedJoinFlow(true)}
              disabled={isSubmitting || !name.trim() || !sessionId}
              createButtonLabel={t("createNewGame")}
              dividerLabel={t("or")}
              joinButtonLabel={t("joinExistingGame")}
            />
          ) : (
            <JoinForm
              joinCode={joinCode ?? ""}
              onJoinCodeChange={(code) => void setJoinCode(code)}
              onSubmit={(event) => void handleJoin(event)}
              onCancel={() => {
                setHasOpenedJoinFlow(false);
                void setJoinCode(null);
              }}
              disabled={isSubmitting || !name.trim() || (joinCode?.length ?? 0) !== 4 || !sessionId}
              lobbyCodeLabel={tLobby("lobbyCode")}
              codePlaceholder={tLobby("codePlaceholder")}
              cancelLabel={t("cancel")}
              joinButtonLabel={t("joinGame")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
