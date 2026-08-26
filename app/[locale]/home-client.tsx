"use client";

import { CreateForm } from "./create-form";
import { HomeHeader } from "./home-header";
import { HomePlayerFields } from "./home-player-fields";
import { JoinForm } from "./join-form";
import { useHomeMatchSetup } from "./use-home-match-setup";

export function HomeClient() {
  const setup = useHomeMatchSetup();

  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-10">
        <HomeHeader
          title={setup.t("flip-x")}
          subtitle={
            setup.isJoinMode
              ? setup.t("Enter your name and join the game")
              : setup.t("Create a game or join an existing one")
          }
        />

        <div className="space-y-6">
          <HomePlayerFields
            name={setup.name}
            onNameChange={setup.setName}
            nameLabel={setup.t("Your name")}
            namePlaceholder={setup.t("Enter your name")}
            colorId={setup.selectedColorId}
            onColorChange={setup.setColorId}
            usedColorIds={setup.isJoinMode ? setup.usedColorIds : []}
            colorLabel={setup.t("Player color")}
          />

          {!setup.isJoinMode ? (
            <CreateForm
              onSubmit={(event) => void setup.handleCreate(event)}
              onOpenJoinFlow={() => setup.setHasOpenedJoinFlow(true)}
              disabled={setup.isSubmitting || !setup.name.trim() || !setup.sessionId}
              createButtonLabel={setup.t("Create New Game")}
              dividerLabel={setup.t("or")}
              joinButtonLabel={setup.t("Join Existing Game")}
            />
          ) : (
            <JoinForm
              joinCode={setup.joinCode ?? ""}
              onJoinCodeChange={(code) => void setup.setJoinCode(code)}
              onSubmit={(event) => void setup.handleJoin(event)}
              onCancel={() => {
                setup.setHasOpenedJoinFlow(false);
                void setup.setJoinCode(null);
              }}
              disabled={
                setup.isSubmitting ||
                !setup.name.trim() ||
                (setup.joinCode?.length ?? 0) !== 4 ||
                !setup.sessionId
              }
              lobbyCodeLabel={setup.tLobby("Lobby code")}
              codePlaceholder={setup.tLobby("ABCD")}
              cancelLabel={setup.t("Cancel")}
              joinButtonLabel={setup.t("Join Game")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
