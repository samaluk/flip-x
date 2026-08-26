"use client";

import { Settings2Icon } from "lucide-react";
import { useExtracted } from "next-intl";
import { startTransition, useActionState } from "react";

import refs from "@/confect/_generated/refs";
import {
  GAME_SETTING_PRESETS,
  MAX_NUMBER_CARD_OPTIONS,
  modifierMaxForSettings,
  recommendedPresetForPlayerCount,
  TARGET_SCORE_OPTIONS,
} from "@/game/logic/game-settings";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { cn } from "@/shared/lib/utils";
import { toastEitherMutationFailure } from "@/shared/lib/either-mutation-toast";
import { useAppErrors } from "@/shared/lib/errors/use-app-errors";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";

export type GameSettingsPanelProps = {
  snapshot: MatchSnapshot;
};

type SettingsPatch = {
  targetScore?: number;
  maxNumberCardValue?: number;
};

export function GameSettingsPanel({ snapshot }: GameSettingsPanelProps) {
  const t = useExtracted("GameSettings");
  const { translateToast: translateError } = useAppErrors();
  const updateMatchSettings = useSessionConfectMutation(refs.public.matches.updateMatchSettings);
  const settings = snapshot.settings;
  const hostCanEdit = snapshot.status === "setup" && (snapshot.isHost ?? false);
  const recommendedPresetId = recommendedPresetForPlayerCount(snapshot.players.length);
  const recommendedPreset = GAME_SETTING_PRESETS.find(
    (preset) => preset.id === recommendedPresetId,
  );

  function presetLabel(presetId: string): string {
    switch (presetId) {
      case "classic":
        return t("Classic");
      case "extended":
        return t("Extended");
      case "big-table":
        return t("Big Table");
      default:
        return presetId;
    }
  }

  function presetHelper(presetId: string): string {
    switch (presetId) {
      case "classic":
        return t("Official baseline. Best for 2-4 players.");
      case "extended":
        return t("Better for 4-5 players. More cards and a slightly longer match.");
      case "big-table":
        return t("Better for 6+ players. Larger deck, higher ceiling, longer match.");
      default:
        return "";
    }
  }

  const [, updateSettings, isUpdating] = useActionState<null, SettingsPatch>(
    async (_previousState, patch) => {
      await toastEitherMutationFailure(
        updateMatchSettings({
          matchId: snapshot.matchId,
          expectedVersion: snapshot.version,
          patch,
        }),
        {
          missingMessage: t("Could not update game settings."),
          translateError,
        },
      );
      return null;
    },
    null,
  );

  return (
    <section className="surface-elevated rounded-2xl p-4 text-foreground sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Settings2Icon className="size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-heading text-base font-medium tracking-tight">
                {t("Game settings")}
              </h2>
              {hostCanEdit && recommendedPreset ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("Recommended for this lobby: {preset}", {
                    preset: presetLabel(recommendedPreset.id),
                  })}
                </p>
              ) : null}
            </div>
          </div>
          {snapshot.status !== "setup" ? (
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              {t("Locked")}
            </span>
          ) : null}
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <SettingSummaryItem label={t("Points to win")} value={String(settings.targetScore)} />
          <SettingSummaryItem label={t("Cards")} value={`0-${settings.maxNumberCardValue}`} />
          <SettingSummaryItem
            label={t("Modifiers")}
            value={`+2 to +${settings.modifierRange.max}, x2`}
          />
          <SettingSummaryItem label={t("Mode")} value={settings.modeLabel} />
        </dl>

        {hostCanEdit ? (
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              {GAME_SETTING_PRESETS.map((preset) => {
                const isActive =
                  settings.targetScore === preset.settings.targetScore &&
                  settings.maxNumberCardValue === preset.settings.maxNumberCardValue;
                const isRecommended = preset.id === recommendedPresetId;

                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    disabled={isUpdating}
                    onClick={() => {
                      startTransition(() => {
                        updateSettings(preset.settings);
                      });
                    }}
                    className={cn(
                      "h-auto min-h-20 flex-col items-start justify-start gap-1 rounded-xl p-3 text-start whitespace-normal",
                      isRecommended && !isActive ? "border-primary/70" : "",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>{presetLabel(preset.id)}</span>
                      {isRecommended ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                          {t("Recommended")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground group-data-[slot=button]:text-current/70">
                      {presetHelper(preset.id)}
                    </span>
                  </Button>
                );
              })}
            </div>

            <Accordion>
              <AccordionItem value="advanced">
                <AccordionTrigger>{t("Advanced")}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    <SettingsSelect
                      label={t("Points to win")}
                      value={settings.targetScore}
                      values={TARGET_SCORE_OPTIONS}
                      disabled={isUpdating}
                      onChange={(targetScore) => {
                        startTransition(() => {
                          updateSettings({ targetScore });
                        });
                      }}
                    />
                    <SettingsSelect
                      label={t("Max number card")}
                      value={settings.maxNumberCardValue}
                      values={MAX_NUMBER_CARD_OPTIONS}
                      disabled={isUpdating}
                      onChange={(maxNumberCardValue) => {
                        startTransition(() => {
                          updateSettings({ maxNumberCardValue });
                        });
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t(
                      "Cards will include numbers 0-{maxNumberCardValue}. Modifiers will go up to +{maxModifierValue}, plus x2.",
                      {
                        maxNumberCardValue: String(settings.maxNumberCardValue),
                        maxModifierValue: String(modifierMaxForSettings(settings)),
                      },
                    )}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SettingSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function SettingsSelect({
  label,
  value,
  values,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  values: readonly number[];
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="settings-select"
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
