"use client";

import { Settings2Icon } from "lucide-react";
import { useExtracted } from "next-intl";

import type { MatchSnapshot } from "@/game/logic/view-models";
import { GameSettingsEditor } from "@/game/screens/game-settings-editor";
import { GameSettingsSummary } from "@/game/screens/game-settings-summary";

export type GameSettingsPanelProps = {
  snapshot: MatchSnapshot;
};

export function GameSettingsPanel({ snapshot }: GameSettingsPanelProps) {
  const t = useExtracted("GameSettings");
  const hostCanEdit = snapshot.status === "setup" && (snapshot.isHost ?? false);

  return (
    <section className="surface-elevated rounded-2xl p-4 text-foreground sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Settings2Icon className="size-5 shrink-0 text-primary" aria-hidden />
          <h2 className="font-heading text-base font-medium tracking-tight">
            {t("Game settings")}
          </h2>
        </div>
        <GameSettingsSummary settings={snapshot.settings} locked={snapshot.status !== "setup"} />
        {hostCanEdit ? <GameSettingsEditor snapshot={snapshot} /> : null}
      </div>
    </section>
  );
}
