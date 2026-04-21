"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useSessionId } from "convex-helpers/react/sessions";
import { useTranslations } from "next-intl";
import { startTransition, type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateConvexError } from "@/shared/lib/convex-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useRouter } from "@/shared/i18n/navigation";
import refs from "@/confect/_generated/refs";

const NAME_STORAGE_KEY = "flip7_player_name";

export function HomeClient() {
  const router = useRouter();
  const [sessionId] = useSessionId();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useQueryState("code", {
    ...parseAsString,
    parse: (value) => value.toUpperCase(),
    serialize: (value) => value.toUpperCase(),
  });
  const [isJoinMode, setIsJoinMode] = useState(!!joinCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedName, setHasLoadedName] = useState(false);

  const t = useTranslations("MatchSetup");
  const tErrors = useTranslations("Errors");
  const tLobby = useTranslations("Lobby");

  const createMatch = useSessionConfectMutation(refs.public.matches.createMatch);
  const joinByCode = useSessionConfectMutation(refs.public.matches.joinByCode);
  const joinMatch = useSessionConfectMutation(refs.public.matches.joinMatch);

  useEffect(() => {
    if (hasLoadedName) return;

    const stored = localStorage.getItem(NAME_STORAGE_KEY);
    if (stored) {
      setName(stored);
    }
    setHasLoadedName(true);
  }, [hasLoadedName]);

  useEffect(() => {
    if (joinCode) {
      setIsJoinMode(true);
    }
  }, [joinCode]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    localStorage.setItem(NAME_STORAGE_KEY, trimmedName);

    if (!trimmedName) {
      toast.error(t("toastNameRequired"));
      return;
    }

    if (trimmedName.length > 20) {
      toast.error(t("toastNameLength"));
      return;
    }

    if (!sessionId) {
      toast.error(t("toastSession"));
      return;
    }

    setIsSubmitting(true);

    try {
      const match = await createMatch({
        hostName: trimmedName,
      });

      startTransition(() => {
        router.push(`/game/${match.matchId}`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastCreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const playerName = name.trim();
    const lobbyCode = (joinCode ?? "").trim();

    localStorage.setItem(NAME_STORAGE_KEY, playerName);

    if (!playerName) {
      toast.error(t("toastNameRequired"));
      return;
    }

    if (playerName.length > 20) {
      toast.error(t("toastNameLength"));
      return;
    }

    if (lobbyCode.length !== 4) {
      toast.error(t("toastCodeLength"));
      return;
    }

    if (!sessionId) {
      toast.error(t("toastSession"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await joinByCode({ lobbyCode: lobbyCode.toUpperCase() });
      await joinMatch({
        matchId: result.matchId,
        playerName: playerName,
      });
      startTransition(() => {
        router.push(`/game/${result.matchId}`);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastJoinFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="selection:bg-primary/20 relative flex min-h-[100dvh] flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <h1 className="text-foreground text-5xl font-medium tracking-tighter">FLIP 7</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isJoinMode
              ? "Enter your name and join the game"
              : "Create a game or join an existing one"}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="playerName" className="text-foreground text-sm font-medium">
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

          {!isJoinMode ? (
            <div className="space-y-6">
              <form onSubmit={handleCreate}>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full text-base font-medium"
                  disabled={isSubmitting || !name.trim() || !sessionId}
                >
                  Create New Game
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background text-muted-foreground px-2">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full text-base"
                onClick={() => setIsJoinMode(true)}
              >
                Join Existing Game
              </Button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="joinCode" className="text-foreground text-sm font-medium">
                  {tLobby("lobbyCode")}
                </label>
                <Input
                  id="joinCode"
                  value={joinCode ?? ""}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={tLobby("codePlaceholder")}
                  maxLength={4}
                  className="h-12 text-center font-mono text-2xl tracking-[0.25em] uppercase"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 flex-1"
                  onClick={() => {
                    setIsJoinMode(false);
                    setJoinCode(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 flex-1 text-base font-medium"
                  disabled={
                    isSubmitting || !name.trim() || (joinCode?.length ?? 0) !== 4 || !sessionId
                  }
                >
                  Join Game
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
