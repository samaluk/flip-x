"use client";

import { PLAYER_COLORS, type PlayerColorId } from "@/shared/lib/player-colors";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

export type PlayerColorPickerProps = {
  value: PlayerColorId;
  onChange: (colorId: PlayerColorId) => void;
  usedColorIds?: readonly string[];
  label: string;
};

const NO_USED_COLOR_IDS: readonly string[] = [];

export function PlayerColorPicker({
  value,
  onChange,
  usedColorIds = NO_USED_COLOR_IDS,
  label,
}: PlayerColorPickerProps) {
  const used = new Set(usedColorIds);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <RadioGroup
        value={value}
        onValueChange={(v) => {
          const match = PLAYER_COLORS.find((c) => c.id === v);
          if (match) onChange(match.id);
        }}
        aria-label={label}
        className="grid-cols-10"
      >
        {PLAYER_COLORS.map((color) => {
          const disabled = used.has(color.id) && color.id !== value;

          return (
            <RadioGroupItem
              key={color.id}
              value={color.id}
              variant="swatch"
              disabled={disabled}
              aria-label={color.label}
              // Theme swatch tokens are selected from a closed PlayerColorId map.
              // oxlint-disable-next-line shadcn/require-static-classes
              className={color.swatchClass}
            />
          );
        })}
      </RadioGroup>
    </div>
  );
}
