"use client";

import { useTranslations } from "next-intl";

import { CardFrame } from "@/components/game/cards/card-frame";
import { ModifierShellFan } from "@/components/game/cards/card-graphics";
import { MODIFIER_CARD_PALETTE } from "@/components/game/cards/card-palettes";
import type { ModifierValue } from "@/lib/game/card-types";

export function ModifierCardContent({ modifierValue }: { modifierValue: ModifierValue }) {
  const t = useTranslations("Cards");
  const p = MODIFIER_CARD_PALETTE;

  const centerLabel = modifierValue === "x2" ? t("modifier.x2") : t("modifier.plus", { value: modifierValue });
  const effectLine =
    modifierValue === "x2"
      ? t("modifier.effectX2")
      : t("modifier.effectPlus", { value: modifierValue });

  return (
    <CardFrame
      borderColor={p.border}
      backgroundColor={p.bg}
      backgroundOverlay={p.bgGradient}
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col items-stretch justify-between gap-1 py-0.5">
        <div className="flex justify-center px-2">
          <ModifierShellFan
            fill={p.fanFill}
            stroke={p.fanStroke}
            className="h-7 w-[min(100%,7rem)] sm:h-9"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center">
          <span
            className="font-heading text-[2.25rem] font-black leading-none tracking-tight sm:text-[3.5rem]"
            style={{
              color: p.centerInk,
              WebkitTextStroke: `2px ${p.centerStroke}`,
              paintOrder: "stroke fill",
            }}
          >
            {centerLabel}
          </span>
          <p
            className="max-w-[13rem] text-[0.45rem] font-bold uppercase leading-snug tracking-wide sm:text-[0.52rem]"
            style={{ color: p.smallText }}
          >
            {effectLine}
          </p>
        </div>

        <div className="flex justify-center px-2">
          <ModifierShellFan
            flip
            fill={p.fanFill}
            stroke={p.fanStroke}
            className="h-7 w-[min(100%,7rem)] sm:h-9"
          />
        </div>
      </div>
    </CardFrame>
  );
}
