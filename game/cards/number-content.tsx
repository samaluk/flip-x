"use client";

import { useExtracted } from "next-intl";
import { useId } from "react";

import { CardFrame } from "@/game/cards/card-frame";
import { cardTw } from "@/game/cards/card-responsive";
import { CARD_NAVY, NUMBER_CARD_PALETTES } from "@/game/cards/card-palettes";

const NUMBER_FRAME: Readonly<{ border: string; background: string }> = {
  border: CARD_NAVY,
  background: "#f5eedc",
};

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
    const gid = `flip-x-zero-grad-${gradientId}`;
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
  const t = useExtracted("Cards");
  const uid = useId().replace(/:/g, "");
  const gradSuffix = uid;
  const palette = NUMBER_CARD_PALETTES[numberValue];

  let numberName: string;
  switch (numberValue) {
    case 0:
      numberName = t("ZERO");
      break;
    case 1:
      numberName = t("ONE");
      break;
    case 2:
      numberName = t("TWO");
      break;
    case 3:
      numberName = t("THREE");
      break;
    case 4:
      numberName = t("FOUR");
      break;
    case 5:
      numberName = t("FIVE");
      break;
    case 6:
      numberName = t("SIX");
      break;
    case 7:
      numberName = t("SEVEN");
      break;
    case 8:
      numberName = t("EIGHT");
      break;
    case 9:
      numberName = t("NINE");
      break;
    case 10:
      numberName = t("TEN");
      break;
    case 11:
      numberName = t("ELEVEN");
      break;
    case 12:
      numberName = t("TWELVE");
      break;
    default:
      numberName = t("ZERO");
  }

  return (
    <CardFrame
      borderColor={NUMBER_FRAME.border}
      backgroundColor={NUMBER_FRAME.background}
      className="h-full"
      compact={compact}
    >
      <div className="relative min-h-0 w-full flex-1">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <div className={cardTw(compact, "-translate-y-3", "sm:-translate-y-5")}>
            <OutlinedDigit
              value={numberValue}
              fill={palette.fill}
              stroke={CARD_NAVY}
              gradientId={gradSuffix}
              compact={compact}
            />
          </div>
        </div>

        <div className="relative z-1 flex h-full min-h-0 flex-col justify-end">
          <div className="relative z-2 flex justify-center pt-0.5 pb-1">
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
                {numberName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardFrame>
  );
}
