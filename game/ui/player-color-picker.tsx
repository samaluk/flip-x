"use client";

import type { CSSProperties } from "react";

import { PLAYER_COLORS, type PlayerColorId } from "@/shared/lib/player-colors";
import { cn } from "@/shared/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

type PlayerColorPickerProps = {
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
        className="grid w-full grid-cols-10 gap-2"
      >
        {PLAYER_COLORS.map((color) => {
          const disabled = used.has(color.id) && color.id !== value;
          const selected = value === color.id;

          return (
            <RadioGroupItem
              key={color.id}
              value={color.id}
              disabled={disabled}
              aria-label={color.label}
              className={cn(
                "size-7 border transition-all focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                "[&_[data-slot=radio-group-indicator]]:hidden",
                selected ? "border-foreground ring-2 ring-primary/70" : "border-border",
                disabled && "cursor-not-allowed opacity-25 grayscale",
              )}
              style={
                {
                  backgroundColor: color.background,
                  color: color.foreground,
                } satisfies CSSProperties
              }
            />
          );
        })}
      </RadioGroup>
    </div>
  );
}
