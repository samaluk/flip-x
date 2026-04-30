"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useQuery as useConfectQuery } from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useTranslations } from "next-intl";
import { startTransition, type SubmitEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "@/shared/lib/player-colors";
import {
  getTrimmedPlayerNameIssue,
  PLAYER_NAME_ISSUE_TOAST_KEY,
} from "@/shared/lib/player-name-validation";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import { translateConvexError } from "@/shared/lib/convex-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useRouter } from "@/shared/i18n/navigation";
import refs from "@/confect/_generated/refs";

const NAME_STORAGE_KEY = "flip7_player_name";
const COLOR_STORAGE_KEY = "flip7_player_color";
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
  const router = useRouter();
  const [sessionId] = useSessionId();
  const [name, setName] = useState("");
  const [colorId, setColorId] = useState<PlayerColorId>("cyan");
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
  const lobbyLookup = useConfectQuery(
    refs.public.matches.getMatchByCode,
    joinCode && joinCode.length === 4 ? { lobbyCode: joinCode } : "skip",
  );
  const usedColorIds = lobbyLookup?.usedColorIds ?? NO_USED_COLORS;

  useEffect(() => {
    if (hasLoadedName) return;

    const stored = localStorage.getItem(NAME_STORAGE_KEY);
    if (stored) {
      setName(stored);
    }
    const storedColor = localStorage.getItem(COLOR_STORAGE_KEY);
    if (storedColor && isPlayerColorId(storedColor)) {
      setColorId(storedColor);
    }
    setHasLoadedName(true);
  }, [hasLoadedName]);

  useEffect(() => {
    if (usedColorIds.includes(colorId)) {
      setColorId(firstAvailablePlayerColorId(usedColorIds));
    }
  }, [colorId, usedColorIds]);

  useEffect(() => {
    if (joinCode) {
      setIsJoinMode(true);
    }
  }, [joinCode]);

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    localStorage.setItem(NAME_STORAGE_KEY, trimmedName);
    localStorage.setItem(COLOR_STORAGE_KEY, colorId);

    const nameIssue = getTrimmedPlayerNameIssue(trimmedName, sessionId);
    if (nameIssue) {
      toast.error(t(PLAYER_NAME_ISSUE_TOAST_KEY[nameIssue]));
      return;
    }

    setIsSubmitting(true);

    try {
      const match = await createMatch({
        hostName: trimmedName,
        hostColorId: colorId,
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

  async function handleJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const playerName = name.trim();
    const lobbyCode = (joinCode ?? "").trim();

    localStorage.setItem(NAME_STORAGE_KEY, playerName);
    localStorage.setItem(COLOR_STORAGE_KEY, colorId);

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
        colorId,
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
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-medium tracking-tighter text-foreground">FLIP 7</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isJoinMode
              ? "Enter your name and join the game"
              : "Create a game or join an existing one"}
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
            value={colorId}
            onChange={setColorId}
            usedColorIds={isJoinMode ? usedColorIds : []}
            label={t("playerColor")}
          />

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
                  <span className="bg-background px-2 text-muted-foreground">or</span>
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
                <label htmlFor="joinCode" className="text-sm font-medium text-foreground">
                  {tLobby("lobbyCode")}
                </label>
                <Input
                  id="joinCode"
                  value={joinCode ?? ""}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
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
