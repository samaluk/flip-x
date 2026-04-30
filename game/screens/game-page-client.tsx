"use client";

import { useSessionId } from "convex-helpers/react/sessions";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SubmitEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import refs from "@/confect/_generated/refs";
import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import { GameTable } from "@/game/screens/game-table";
import { LobbyCodeDisplay } from "@/game/screens/lobby-code-display";
import { StartGameButton } from "@/game/screens/start-game-button";
import { useMatchPresence } from "@/game/hooks/use-match-presence";
import {
  firstAvailablePlayerColorId,
  isPlayerColorId,
  type PlayerColorId,
} from "@/shared/lib/player-colors";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";
import { useSessionConfectMutation, useSessionConfectQuery } from "@/shared/lib/confect-hooks";
import { translateConvexError } from "@/shared/lib/convex-error";
import {
  getTrimmedPlayerNameIssue,
  PLAYER_NAME_ISSUE_TOAST_KEY,
} from "@/shared/lib/player-name-validation";

const COLOR_STORAGE_KEY = "flip7_player_color";

export function GamePageClient({ matchId }: { matchId: Id<"matches"> }) {
  const [sessionId] = useSessionId();
  const joinMatch = useSessionConfectMutation(refs.public.matches.joinMatch);
  const [playerName, setPlayerName] = useState("");
  const [colorId, setColorId] = useState<PlayerColorId>("cyan");
  const [isJoining, setIsJoining] = useState(false);
  const snapshot = useSessionConfectQuery(refs.public.matches.getMatchSnapshot, { matchId });
  const t = useTranslations("Game");
  const tErrors = useTranslations("Errors");
  const viewerPlayerId = snapshot?.viewerPlayerId
    ? (snapshot.viewerPlayerId as Id<"players">)
    : undefined;
  const onlinePlayerIds = useMatchPresence(matchId, viewerPlayerId);
  const usedColorIds = useMemo(
    () =>
      snapshot?.players
        .map((player) => player.colorId)
        .filter((playerColorId): playerColorId is string => typeof playerColorId === "string") ?? [],
    [snapshot?.players],
  );

  useEffect(() => {
    const storedColor = localStorage.getItem(COLOR_STORAGE_KEY);
    if (storedColor && isPlayerColorId(storedColor)) {
      setColorId(storedColor);
    }
  }, []);

  useEffect(() => {
    if (usedColorIds.includes(colorId)) {
      setColorId(firstAvailablePlayerColorId(usedColorIds));
    }
  }, [colorId, usedColorIds]);

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
        await joinMatch({
          matchId,
          playerName: trimmedName,
          playerColorId: colorId,
        });
        localStorage.setItem(COLOR_STORAGE_KEY, colorId);
        setPlayerName("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        toast.error(
          message
            ? translateConvexError(message, tErrors, (detail) =>
                tErrors("generic", {
                  message: detail,
                }),
              )
            : t("toastJoinFailed"),
        );
      } finally {
        setIsJoining(false);
      }
    },
    [colorId, joinMatch, matchId, playerName, sessionId, t, tErrors],
  );

  const copyInviteLink = useCallback(async () => {
    try {
      const url = snapshot?.lobbyCode
        ? `${window.location.origin}?code=${snapshot.lobbyCode}`
        : window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success(t("toastInviteCopied"));
    } catch {
      toast.error(t("toastInviteCopyFailed"));
    }
  }, [snapshot?.lobbyCode, t]);

  if (snapshot === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Alert>
          <AlertTitle>{t("matchNotFoundTitle")}</AlertTitle>
          <AlertDescription>{t("matchNotFoundBody")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const snapshotWithPresence = {
    ...snapshot,
    players: snapshot.players.map((player) => ({
      ...player,
      isOnline: onlinePlayerIds?.includes(player.playerId as Id<"players">) ?? false,
    })),
  };

  const isSetup = snapshotWithPresence.status === "setup";
  const playerCount = snapshotWithPresence.players.length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 pt-4 pb-6 sm:gap-5 sm:px-5 sm:pt-5 sm:pb-8 lg:px-6">
      {isSetup || !snapshotWithPresence.viewerPlayerId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pe-24 sm:pe-28">
          <div className="flex flex-wrap items-center gap-3">
            {isSetup && snapshotWithPresence.lobbyCode ? (
              <LobbyCodeDisplay code={snapshotWithPresence.lobbyCode} />
            ) : null}
            {isSetup ? (
              <StartGameButton
                matchId={matchId}
                version={snapshotWithPresence.version}
                isHost={snapshotWithPresence.isHost ?? false}
                playerCount={playerCount}
              />
            ) : null}
          </div>
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            <LinkIcon />
            <span className="hidden sm:inline">{t("copyInvite")}</span>
          </Button>
        </div>
      ) : (
        <div className="flex justify-end pe-24 sm:pe-28">
          <Button variant="ghost" size="sm" onClick={copyInviteLink}>
            <LinkIcon />
            <span className="hidden sm:inline">{t("copyInvite")}</span>
          </Button>
        </div>
      )}

      {!snapshotWithPresence.viewerPlayerId && isSetup ? (
        <div className="surface-elevated rounded-2xl p-6">
          <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
            {t("joinTitle")}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">{t("joinSubtitle")}</p>
          <form onSubmit={handleJoin} className="flex flex-col gap-4 sm:max-w-md">
            <div className="flex gap-3">
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t("namePlaceholder")}
                maxLength={20}
                className="max-w-xs"
              />
              <Button
                type="submit"
                disabled={isJoining || !playerName.trim()}
                className="font-medium"
              >
                {t("joinGame")}
              </Button>
            </div>
            <PlayerColorPicker
              value={colorId}
              onChange={setColorId}
              usedColorIds={usedColorIds}
              label={t("playerColor")}
            />
          </form>
        </div>
      ) : null}

      <GameTable snapshot={snapshotWithPresence} />
    </main>
  );
}
