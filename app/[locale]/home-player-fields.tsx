import type { PlayerColorId } from "@/shared/lib/player-colors";
import { PlayerColorPicker } from "@/game/ui/player-color-picker";
import { Input } from "@/shared/ui/input";

export interface HomePlayerFieldsProps {
  name: string;
  onNameChange: (name: string) => void;
  nameLabel: string;
  namePlaceholder: string;
  colorId: PlayerColorId;
  onColorChange: (colorId: PlayerColorId) => void;
  usedColorIds: readonly string[];
  colorLabel: string;
}

export function HomePlayerFields({
  name,
  onNameChange,
  nameLabel,
  namePlaceholder,
  colorId,
  onColorChange,
  usedColorIds,
  colorLabel,
}: HomePlayerFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="playerName" className="text-sm font-medium text-foreground">
          {nameLabel}
        </label>
        <Input
          id="playerName"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
          maxLength={20}
          className="h-12"
        />
      </div>

      <PlayerColorPicker
        value={colorId}
        onChange={onColorChange}
        usedColorIds={usedColorIds}
        label={colorLabel}
      />
    </>
  );
}
