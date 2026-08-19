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
          title={setup.t("title")}
          subtitle={setup.isJoinMode ? setup.t("subtitleJoin") : setup.t("subtitleCreate")}
        />

        <div className="space-y-6">
          <HomePlayerFields
            name={setup.name}
            onNameChange={setup.setName}
            nameLabel={setup.t("yourName")}
            namePlaceholder={setup.t("namePlaceholder")}
            colorId={setup.selectedColorId}
            onColorChange={setup.setColorId}
            usedColorIds={setup.isJoinMode ? setup.usedColorIds : []}
            colorLabel={setup.t("playerColor")}
          />

          {!setup.isJoinMode ? (
            <CreateForm
              onSubmit={(event) => void setup.handleCreate(event)}
              onOpenJoinFlow={() => setup.setHasOpenedJoinFlow(true)}
              disabled={setup.isSubmitting || !setup.name.trim() || !setup.sessionId}
              createButtonLabel={setup.t("createNewGame")}
              dividerLabel={setup.t("or")}
              joinButtonLabel={setup.t("joinExistingGame")}
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
              lobbyCodeLabel={setup.tLobby("lobbyCode")}
              codePlaceholder={setup.tLobby("codePlaceholder")}
              cancelLabel={setup.t("cancel")}
              joinButtonLabel={setup.t("joinGame")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
