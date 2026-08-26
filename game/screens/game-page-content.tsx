"use client";

import { LinkIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import type { SubmitEvent } from "react";

import { GameSettingsPanel } from "@/game/screens/game-settings-panel";
import { GameTable } from "@/game/screens/game-table";
import { LobbyCodeDisplay } from "@/game/screens/lobby-code-display";
import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import { StartGameButton } from "@/game/screens/start-game-button";
import type { MatchSnapshot } from "@/game/logic/view-models";
import type { PlayerColorId } from "@/shared/lib/player-colors";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export type GamePageContentProps = {
  matchId: string;
  snapshot: MatchSnapshot;
  playerName: string;
  selectedColorId: PlayerColorId;
  usedColorIds: string[];
  isJoining: boolean;
  onJoin: (event: SubmitEvent<HTMLFormElement>) => void;
  onPlayerNameChange: (value: string) => void;
  onColorChange: (colorId: PlayerColorId) => void;
  onCopyInvite: () => void;
};

export function GamePageError({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Alert>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{body}</AlertDescription>
      </Alert>
    </div>
  );
}

export function GamePageContent({
  matchId,
  snapshot,
  playerName,
  selectedColorId,
  usedColorIds,
  isJoining,
  onJoin,
  onPlayerNameChange,
  onColorChange,
  onCopyInvite,
}: GamePageContentProps) {
  const isSetup = snapshot.status === "setup";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 pt-4 pb-6 sm:gap-5 sm:px-5 sm:pt-5 sm:pb-8 lg:px-6">
      <GamePageHeader snapshot={snapshot} matchId={matchId} onCopyInvite={onCopyInvite} />
      {isSetup && !snapshot.viewerPlayerId ? (
        <GameJoinForm
          playerName={playerName}
          selectedColorId={selectedColorId}
          usedColorIds={usedColorIds}
          isJoining={isJoining}
          onJoin={onJoin}
          onPlayerNameChange={onPlayerNameChange}
          onColorChange={onColorChange}
        />
      ) : null}
      {isSetup ? <GameSettingsPanel snapshot={snapshot} /> : null}
      <GameTable snapshot={snapshot} />
    </main>
  );
}

function GamePageHeader({
  snapshot,
  matchId,
  onCopyInvite,
}: {
  snapshot: MatchSnapshot;
  matchId: string;
  onCopyInvite: () => void;
}) {
  const t = useExtracted("Game");
  const showLobbyActions = snapshot.status === "setup" || !snapshot.viewerPlayerId;

  return (
    <div className={headerClass(showLobbyActions)}>
      {showLobbyActions ? <GamePageLobbyActions snapshot={snapshot} matchId={matchId} /> : null}
      <Button variant={showLobbyActions ? "outline" : "ghost"} size="sm" onClick={onCopyInvite}>
        <LinkIcon />
        <span className="hidden sm:inline">{t("Copy invite link")}</span>
      </Button>
    </div>
  );
}

function headerClass(showLobbyActions: boolean) {
  return showLobbyActions
    ? "flex flex-wrap items-center justify-between gap-3 pe-24 sm:pe-28"
    : "flex justify-end pe-24 sm:pe-28";
}

// fallow-ignore-next-line complexity -- setup-only lobby controls are a small presentational leaf; interaction behavior is covered by the existing game flow tests.
function GamePageLobbyActions({ snapshot, matchId }: { snapshot: MatchSnapshot; matchId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {snapshot.status === "setup" && snapshot.lobbyCode ? (
        <LobbyCodeDisplay code={snapshot.lobbyCode} />
      ) : null}
      {snapshot.status === "setup" ? (
        <StartGameButton
          matchId={matchId}
          version={snapshot.version}
          isHost={snapshot.isHost ?? false}
          playerCount={snapshot.players.length}
        />
      ) : null}
    </div>
  );
}

function GameJoinForm({
  playerName,
  selectedColorId,
  usedColorIds,
  isJoining,
  onJoin,
  onPlayerNameChange,
  onColorChange,
}: Omit<GamePageContentProps, "matchId" | "snapshot" | "onCopyInvite">) {
  const t = useExtracted("Game");

  return (
    <div className="surface-elevated rounded-2xl p-6">
      <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
        {t("Join the game")}
      </h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        {t("Enter your name to claim a seat at the table.")}
      </p>
      <form onSubmit={onJoin} className="flex flex-col gap-4 sm:max-w-md">
        <div className="flex gap-3">
          <Input
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder={t("Your name")}
            maxLength={20}
            className="max-w-xs"
          />
          <Button type="submit" disabled={isJoining || !playerName.trim()} className="font-medium">
            {t("Join Game")}
          </Button>
        </div>
        <PlayerColorPicker
          value={selectedColorId}
          onChange={onColorChange}
          usedColorIds={usedColorIds}
          label={t("Player color")}
        />
      </form>
    </div>
  );
}
