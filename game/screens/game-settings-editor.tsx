"use client";

import { useExtracted } from "next-intl";
import { useTransition } from "react";

import refs from "@/confect/_generated/refs";
import {
  GAME_SETTING_PRESETS,
  MAX_NUMBER_CARD_OPTIONS,
  modifierMaxForSettings,
  recommendedPresetForPlayerCount,
  TARGET_SCORE_OPTIONS,
} from "@/game/logic/game-settings";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { toastResultMutationFailure } from "@/shared/lib/result-mutation-toast";
import { useAppErrors } from "@/shared/lib/errors/use-app-errors";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";

type SettingsPatch = {
  targetScore?: number;
  maxNumberCardValue?: number;
};

export function GameSettingsEditor({ snapshot }: { snapshot: MatchSnapshot }) {
  const t = useExtracted("GameSettings");
  const { translateToast: translateError } = useAppErrors();
  const updateMatchSettings = useSessionConfectMutation(refs.public.matches.updateMatchSettings);
  const settings = snapshot.settings;
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

  const [isUpdating, startTransition] = useTransition();

  function updateSettings(patch: SettingsPatch) {
    startTransition(async () => {
      await toastResultMutationFailure(
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
    });
  }

  return (
    <div className="space-y-4">
      {recommendedPreset ? (
        <p className="text-xs text-muted-foreground">
          {t("Recommended for this lobby: {preset}", {
            preset: presetLabel(recommendedPreset.id),
          })}
        </p>
      ) : null}
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
                variant={isActive ? "default" : isRecommended ? "outline-accent" : "outline"}
                size="tile"
                disabled={isUpdating}
                onClick={() => updateSettings(preset.settings)}
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
              <div className="grid gap-4 pbs-2 sm:grid-cols-2">
                <SettingsSelect
                  label={t("Points to win")}
                  value={settings.targetScore}
                  values={TARGET_SCORE_OPTIONS}
                  disabled={isUpdating}
                  onChange={(targetScore) => updateSettings({ targetScore })}
                />
                <SettingsSelect
                  label={t("Max number card")}
                  value={settings.maxNumberCardValue}
                  values={MAX_NUMBER_CARD_OPTIONS}
                  disabled={isUpdating}
                  onChange={(maxNumberCardValue) => updateSettings({ maxNumberCardValue })}
                />
              </div>
              <p className="mbs-3 text-sm text-muted-foreground">
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
