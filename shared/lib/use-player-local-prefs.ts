"use client";

import { useLocalStorage } from "usehooks-ts";

import {
  DEFAULT_PLAYER_COLOR_ID,
  deserializePlayerColorId,
  PLAYER_COLOR_STORAGE_KEY,
  PLAYER_NAME_STORAGE_KEY,
} from "@/shared/lib/player-local-prefs";
import type { PlayerColorId } from "@/shared/lib/player-colors";

const SSR_LOCAL_STORAGE_OPTIONS = { initializeWithValue: false } as const;

export function usePlayerLocalPrefs() {
  const [name, setName] = useLocalStorage(PLAYER_NAME_STORAGE_KEY, "", SSR_LOCAL_STORAGE_OPTIONS);
  const [colorId, setColorId] = useLocalStorage<PlayerColorId>(
    PLAYER_COLOR_STORAGE_KEY,
    DEFAULT_PLAYER_COLOR_ID,
    {
      ...SSR_LOCAL_STORAGE_OPTIONS,
      serializer: (value) => value,
      deserializer: deserializePlayerColorId,
    },
  );

  return { name, setName, colorId, setColorId };
}
