import { invalidGameSettings } from "../../shared/lib/errors/domain";

export type GameSettings = {
  targetScore: number;
  maxNumberCardValue: number;
};

export type GameSettingsSnapshot = GameSettings & {
  numberCardRange: {
    min: 0;
    max: number;
  };
  modifierRange: {
    min: 2;
    max: number;
    includesX2: true;
  };
  modeLabel: string;
};

export const DEFAULT_GAME_SETTINGS = {
  targetScore: 200,
  maxNumberCardValue: 12,
} satisfies GameSettings;

export const GAME_SETTING_PRESETS = [
  {
    id: "classic",
    label: "Classic",
    helper: "Official baseline. Best for 2-4 players.",
    recommendedPlayerRange: "2-4",
    settings: {
      targetScore: 200,
      maxNumberCardValue: 12,
    },
  },
  {
    id: "extended",
    label: "Extended",
    helper: "Better for 4-5 players. More cards and a slightly longer match.",
    recommendedPlayerRange: "4-5",
    settings: {
      targetScore: 250,
      maxNumberCardValue: 14,
    },
  },
  {
    id: "big-table",
    label: "Big Table",
    helper: "Better for 6+ players. Larger deck, higher ceiling, longer match.",
    recommendedPlayerRange: "6+",
    settings: {
      targetScore: 300,
      maxNumberCardValue: 16,
    },
  },
] as const;

export const TARGET_SCORE_OPTIONS = [200, 250, 300, 400, 500] as const;
export const MAX_NUMBER_CARD_OPTIONS = [12, 14, 16, 18, 20] as const;

export function modifierMaxForSettings(settings: Pick<GameSettings, "maxNumberCardValue">) {
  return settings.maxNumberCardValue - 2;
}

export function recommendedPresetForPlayerCount(playerCount: number) {
  if (playerCount <= 4) {
    return "classic";
  }
  if (playerCount <= 5) {
    return "extended";
  }
  return "big-table";
}

export function settingsModeLabel(settings: Pick<GameSettings, "maxNumberCardValue">) {
  if (settings.maxNumberCardValue === 12) {
    return "Classic Game";
  }
  if (settings.maxNumberCardValue === 14) {
    return "Extended Game";
  }
  if (settings.maxNumberCardValue >= 16) {
    return "Big Table";
  }
  return "Custom Game";
}

export function normalizeAndValidateGameSettings(settings: Partial<GameSettings>): GameSettings {
  const nextSettings = {
    targetScore: settings.targetScore ?? DEFAULT_GAME_SETTINGS.targetScore,
    maxNumberCardValue: settings.maxNumberCardValue ?? DEFAULT_GAME_SETTINGS.maxNumberCardValue,
  };

  if (
    !Number.isFinite(nextSettings.targetScore) ||
    !Number.isInteger(nextSettings.targetScore) ||
    nextSettings.targetScore < 200
  ) {
    throw invalidGameSettings();
  }

  if (
    !Number.isFinite(nextSettings.maxNumberCardValue) ||
    !Number.isInteger(nextSettings.maxNumberCardValue) ||
    nextSettings.maxNumberCardValue < 12 ||
    nextSettings.maxNumberCardValue % 2 !== 0
  ) {
    throw invalidGameSettings();
  }

  return nextSettings;
}

export function settingsFromMatch(match: {
  targetScore: number;
  maxNumberCardValue?: number;
}): GameSettings {
  return {
    targetScore: match.targetScore,
    maxNumberCardValue: match.maxNumberCardValue ?? DEFAULT_GAME_SETTINGS.maxNumberCardValue,
  };
}

export function buildGameSettingsSnapshot(settings: GameSettings): GameSettingsSnapshot {
  return {
    ...settings,
    numberCardRange: {
      min: 0,
      max: settings.maxNumberCardValue,
    },
    modifierRange: {
      min: 2,
      max: modifierMaxForSettings(settings),
      includesX2: true,
    },
    modeLabel: settingsModeLabel(settings),
  };
}

export function gameSettingsEqual(left: GameSettings, right: GameSettings) {
  return (
    left.targetScore === right.targetScore &&
    left.maxNumberCardValue === right.maxNumberCardValue
  );
}
