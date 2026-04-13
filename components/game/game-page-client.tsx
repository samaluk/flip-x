"use client";

import { useSessionId, useSessionMutation, useSessionQuery } from "convex-helpers/react/sessions";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";

import { GameTable } from "@/components/game/game-table";
import { LobbyCodeDisplay } from "@/components/game/lobby-code-display";
import { StartGameButton } from "@/components/game/start-game-button";
import { useMatchPresence } from "@/components/game/use-match-presence";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { translateConvexError } from "@/lib/convex-error";

export function GamePageClient({ matchId }: { matchId: Id<"matches"> }) {
  const [sessionId] = useSessionId();
  const joinMatch = useSessionMutation(api.matches.joinMatch);
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const snapshot = useSessionQuery(api.matches.getMatchSnapshot, { matchId });
  const t = useTranslations("Game");
  const tErrors = useTranslations("Errors");
  const viewerPlayerId = snapshot?.viewerPlayerId ? (snapshot.viewerPlayerId as Id<"players">) : undefined;
  const onlinePlayerIds = useMatchPresence(matchId, viewerPlayerId);

  const handleJoin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = playerName.trim();
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

    setIsJoining(true);
    try {
      await joinMatch({
        matchId,
        playerName: trimmedName,
      });
      setPlayerName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastJoinFailed"));
    } finally {
      setIsJoining(false);
    }
  }, [joinMatch, matchId, playerName, sessionId, t, tErrors]);

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
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
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
    <main className="mx-auto flex w-full max-w-9/10 flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isSetup && snapshotWithPresence.lobbyCode ? <LobbyCodeDisplay code={snapshotWithPresence.lobbyCode} /> : null}
          {isSetup ? (
            <StartGameButton matchId={matchId} isHost={snapshotWithPresence.isHost ?? false} playerCount={playerCount} />
          ) : null}
        </div>
        <Button variant="outline" onClick={copyInviteLink}>
          <LinkIcon />
          {t("copyInvite")}
        </Button>
      </div>
    
      {!snapshotWithPresence.viewerPlayerId && isSetup ? (
        <div className="surface-elevated rounded-2xl p-6">
          <h2 className="font-heading text-foreground text-lg font-medium tracking-tight">
            {t("joinTitle")}
          </h2>
          <p className="text-muted-foreground mt-1 mb-4 text-sm">{t("joinSubtitle")}</p>
          <form onSubmit={handleJoin} className="flex gap-3">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={20}
              className="max-w-xs"
            />
            <Button type="submit" disabled={isJoining || !playerName.trim()} className="font-medium">
              {t("joinGame")}
            </Button>
          </form>
        </div>
      ) : null}

      <GameTable snapshot={snapshotWithPresence} />
    </main>
  );
}
