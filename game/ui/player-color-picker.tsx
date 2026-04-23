"use client";

import type { CSSProperties } from "react";

import { PLAYER_COLORS, type PlayerColorId } from "@/shared/lib/player-colors";
import { cn } from "@/shared/lib/utils";

type PlayerColorPickerProps = {
  value: PlayerColorId;
  onChange: (colorId: PlayerColorId) => void;
  usedColorIds?: readonly string[];
  label: string;
};

export function PlayerColorPicker({
  value,
  onChange,
  usedColorIds = [],
  label,
}: PlayerColorPickerProps) {
  const used = new Set(usedColorIds);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-foreground text-sm font-medium">{label}</div>
      <div className="grid grid-cols-10 gap-2" role="radiogroup" aria-label={label}>
        {PLAYER_COLORS.map((color) => {
          const disabled = used.has(color.id) && color.id !== value;
          const selected = value === color.id;

          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color.label}
              disabled={disabled}
              onClick={() => onChange(color.id)}
              className={cn(
                "size-7 rounded-full border transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                selected ? "border-foreground ring-2 ring-primary/70" : "border-border",
                disabled && "cursor-not-allowed opacity-25 grayscale",
              )}
              style={
                {
                  backgroundColor: color.background,
                  color: color.foreground,
                } satisfies CSSProperties
              }
            >
              <span className="sr-only">{color.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
