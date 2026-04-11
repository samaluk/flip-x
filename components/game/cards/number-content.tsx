"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import { CardFrame } from "@/components/game/cards/card-frame";
import { cardTw } from "@/lib/game/card-responsive";
import { CARD_NAVY, NUMBER_CARD_PALETTES } from "@/components/game/cards/card-palettes";
const NUMBER_FRAME = {
  border: CARD_NAVY,
  background: "#f5eedc",
} as const;

type NumberNameMessageId =
  | "numberName.0"
  | "numberName.1"
  | "numberName.2"
  | "numberName.3"
  | "numberName.4"
  | "numberName.5"
  | "numberName.6"
  | "numberName.7"
  | "numberName.8"
  | "numberName.9"
  | "numberName.10"
  | "numberName.11"
  | "numberName.12";

function numberNameId(value: number): NumberNameMessageId {
  return `numberName.${value}` as NumberNameMessageId;
}

function OutlinedDigit({
  value,
  fill,
  stroke,
  gradientId,
  compact,
}: {
  value: number;
  fill: string;
  stroke: string;
  /** Unique id suffix for SVG defs when value is 0 */
  gradientId: string;
  compact?: boolean;
}) {
  const text = String(value);

  if (value === 0) {
    const gid = `flip7-zero-grad-${gradientId}`;
    return (
      <svg
        className={cardTw(
          compact,
          "h-[4.75rem] w-[3.1rem] shrink-0",
          "sm:h-[7.25rem] sm:w-[4.85rem]",
        )}
        viewBox="0 0 56 76"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ed1c24" />
            <stop offset="18%" stopColor="#2D368E" />
            <stop offset="36%" stopColor="#fde96b" />
            <stop offset="54%" stopColor="#6ca8d2" />
            <stop offset="72%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ed1c24" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="64"
          textAnchor="middle"
          fontSize="72"
          fontWeight={900}
          stroke={stroke}
          strokeWidth={4}
          fill={`url(#${gid})`}
          style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
        >
          {text}
        </text>
      </svg>
    );
  }

  return (
    <span
      className={cardTw(
        compact,
        "inline-block font-heading text-[4.25rem] font-black leading-none tracking-tighter",
        "sm:text-[6.75rem]",
      )}
      style={{
        color: fill,
        WebkitTextStroke: `3.5px ${stroke}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </span>
  );
}

export function NumberCardContent({
  numberValue,
  compact = false,
}: {
  numberValue: number;
  compact?: boolean;
}) {
  const t = useTranslations("Cards");
  const uid = useId().replace(/:/g, "");
  const gradSuffix = uid;
  const palette = NUMBER_CARD_PALETTES[numberValue];
  return (
    <CardFrame
      borderColor={NUMBER_FRAME.border}
      backgroundColor={NUMBER_FRAME.background}
      className="h-full"
      compact={compact}
    >
      <div className="relative min-h-0 w-full flex-1">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <div
            className={cardTw(compact, "-translate-y-3", "sm:-translate-y-5")}
          >
            <OutlinedDigit
              value={numberValue}
              fill={palette.fill}
              stroke={CARD_NAVY}
              gradientId={gradSuffix}
              compact={compact}
            />
          </div>
        </div>

        <div className="relative z-[1] flex h-full min-h-0 flex-col justify-end">
          <div className="relative z-[2] flex justify-center pb-1 pt-0.5">
            <div
              className={cardTw(
                compact,
                "w-[min(100%,11rem)] rounded-md border-2 px-1.5 py-0.5 text-center",
                "sm:px-2 sm:py-1",
              )}
              style={{ borderColor: CARD_NAVY, backgroundColor: "#fff9e0" }}
            >
              <span
                className={cardTw(
                  compact,
                  "font-heading text-[0.55rem] font-bold uppercase leading-tight tracking-wide text-[#2D368E]",
                  "sm:text-[0.65rem]",
                )}
              >
                {t(numberNameId(numberValue))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardFrame>
  );
}
