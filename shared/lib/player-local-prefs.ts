import { firstAvailablePlayerColorId, isPlayerColorId, type PlayerColorId } from "@/shared/lib/player-colors";

export const PLAYER_NAME_STORAGE_KEY = "flip7_player_name";
export const PLAYER_COLOR_STORAGE_KEY = "flip7_player_color";

export const DEFAULT_PLAYER_COLOR_ID: PlayerColorId = "cyan";

export function deserializePlayerColorId(raw: string): PlayerColorId {
  return isPlayerColorId(raw) ? raw : DEFAULT_PLAYER_COLOR_ID;
}

export function resolvePlayerColorId(
  colorId: PlayerColorId,
  usedColorIds: readonly string[],
): PlayerColorId {
  return usedColorIds.includes(colorId) ? firstAvailablePlayerColorId(usedColorIds) : colorId;
}
