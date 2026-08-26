"use client";

import { CreateForm } from "./create-form";
import { HomeHeader } from "./home-header";
import { HomePlayerFields } from "./home-player-fields";
import { JoinForm } from "./join-form";
import { useHomeMatchSetup } from "./use-home-match-setup";

export function HomeClient() {
  const setup = useHomeMatchSetup();
  const { labels } = setup;

  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-10">
        <HomeHeader
          title={labels.title}
          subtitle={setup.isJoinMode ? labels.subtitleJoin : labels.subtitleCreate}
        />

        <div className="space-y-6">
          <HomePlayerFields
            name={setup.name}
            onNameChange={setup.setName}
            nameLabel={labels.yourName}
            namePlaceholder={labels.namePlaceholder}
            colorId={setup.selectedColorId}
            onColorChange={setup.setColorId}
            usedColorIds={setup.isJoinMode ? setup.usedColorIds : []}
            colorLabel={labels.playerColor}
          />

          {!setup.isJoinMode ? (
            <CreateForm
              onSubmit={(event) => void setup.handleCreate(event)}
              onOpenJoinFlow={() => setup.setHasOpenedJoinFlow(true)}
              disabled={setup.isSubmitting || !setup.name.trim() || !setup.sessionId}
              createButtonLabel={labels.createNewGame}
              dividerLabel={labels.or}
              joinButtonLabel={labels.joinExistingGame}
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
              lobbyCodeLabel={labels.lobbyCode}
              codePlaceholder={labels.codePlaceholder}
              cancelLabel={labels.cancel}
              joinButtonLabel={labels.joinGame}
            />
          )}
        </div>
      </div>
    </main>
  );
}
