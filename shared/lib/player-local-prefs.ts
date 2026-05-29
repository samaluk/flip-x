import { isPlayerColorId, type PlayerColorId } from "@/shared/lib/player-colors";

const PLAYER_NAME_STORAGE_KEY = "flip7_player_name";
const PLAYER_COLOR_STORAGE_KEY = "flip7_player_color";

export function readStoredPlayerName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(PLAYER_NAME_STORAGE_KEY) ?? "";
}

export function readStoredPlayerColorId(): PlayerColorId {
  if (typeof window === "undefined") {
    return "cyan";
  }

  const storedColor = localStorage.getItem(PLAYER_COLOR_STORAGE_KEY);
  return storedColor && isPlayerColorId(storedColor) ? storedColor : "cyan";
}

export function writeStoredPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
}

export function writeStoredPlayerColorId(colorId: PlayerColorId): void {
  localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, colorId);
}
