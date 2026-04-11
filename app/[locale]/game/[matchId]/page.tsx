"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { GameTable } from "@/components/game/game-table";
import { LobbyCodeDisplay } from "@/components/game/lobby-code-display";
import { StartGameButton } from "@/components/game/start-game-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAnonymousSessionId } from "@/lib/anonymous-session";
import { translateConvexError } from "@/lib/convex-error";

export default function GamePage({
  params,
}: {
  params: Promise<{ locale: string; matchId: string }>;
}) {
  const { matchId } = use(params);
  const sessionId = useAnonymousSessionId();
  const joinMatch = useMutation(api.matches.joinMatch);
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const snapshot = useQuery(api.matches.getMatchSnapshot, {
    matchId: matchId as Id<"matches">,
    sessionId: sessionId || undefined,
  });
  const t = useTranslations("Game");
  const tErrors = useTranslations("Errors");

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
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
        matchId: matchId as Id<"matches">,
        playerName: trimmedName,
        sessionId,
      });
      setPlayerName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastJoinFailed"));
    } finally {
      setIsJoining(false);
    }
  }

  async function copyInviteLink() {
    try {
      const url = snapshot?.lobbyCode
        ? `${window.location.origin}?code=${snapshot.lobbyCode}`
        : window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success(t("toastInviteCopied"));
    } catch {
      toast.error(t("toastInviteCopyFailed"));
    }
  }

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

  const isSetup = snapshot.status === "setup";
  const claimedCount = snapshot.players.filter((p) => p.isClaimed).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {isSetup && snapshot.lobbyCode && <LobbyCodeDisplay code={snapshot.lobbyCode} />}
          {isSetup && (
            <StartGameButton
              matchId={matchId}
              sessionId={sessionId}
              isHost={snapshot.isHost ?? false}
              playerCount={claimedCount}
            />
          )}
        </div>
        <Button variant="outline" onClick={copyInviteLink}>
          <LinkIcon />
          {t("copyInvite")}
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {!snapshot.viewerPlayerId && isSetup ? (
          <motion.div
            key="join-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="surface-elevated rounded-2xl p-6"
          >
            <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
              {t("joinTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{t("joinSubtitle")}</p>
            <form onSubmit={handleJoin} className="flex gap-3">
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
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <GameTable snapshot={snapshot} sessionId={sessionId} />
      </motion.div>
    </main>
  );
}
