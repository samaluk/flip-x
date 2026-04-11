"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CardFrame } from "@/components/game/cards/card-frame";
import {
  FannedCardsIcon,
  HeartIcon,
  LightningBolt,
  PadlockIcon,
} from "@/components/game/cards/card-graphics";
import { ACTION_CARD_PALETTES } from "@/components/game/cards/card-palettes";
import type { ActionKind } from "@/lib/game/card-types";

function InstantActionBlock({
  lightningFill,
  lightningStroke,
  labelColor,
  instant,
  action,
}: {
  lightningFill: string;
  lightningStroke: string;
  labelColor: string;
  instant: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <LightningBolt
        fill={lightningFill}
        stroke={lightningStroke}
        className="h-7 w-4 shrink-0 sm:h-9 sm:w-5"
      />
      <div
        className="flex flex-col text-[0.32rem] font-bold uppercase leading-[1.05] tracking-wide sm:text-[0.38rem]"
        style={{
          color: labelColor,
          transform: "skewX(-8deg)",
        }}
      >
        <span>{instant}</span>
        <span>{action}</span>
      </div>
    </div>
  );
}

function SkewedHelperText({ children, color }: { children: ReactNode; color: string }) {
  return (
    <p
      className="text-center text-[0.42rem] font-bold uppercase italic leading-tight tracking-wide sm:text-[0.48rem]"
      style={{ color, transform: "skewX(-10deg)" }}
    >
      {children}
    </p>
  );
}

export function ActionCardContent({ actionKind }: { actionKind: ActionKind }) {
  const t = useTranslations("Cards");
  const p = ACTION_CARD_PALETTES[actionKind];
  const instant = t("actionHelper.instant");
  const actionWord = t("actionHelper.action");
  const lightningStroke = actionKind === "freeze" ? p.orange : p.border;

  return (
    <CardFrame
      borderColor={p.border}
      backgroundColor={p.bg}
      backgroundOverlay={p.bgGradient}
      className="h-full"
    >
      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-1">
        {actionKind === "second_chance" ? (
          <HeartIcon
            fill={p.heartFill}
            stroke={p.border}
            className="absolute left-1 top-0 h-5 w-6 -rotate-12 opacity-95 sm:left-2 sm:top-1 sm:h-6 sm:w-7"
          />
        ) : null}

        {/* Top row */}
        <div className="flex shrink-0 items-start justify-between gap-1 px-0.5 pt-0.5 sm:px-1">
          {actionKind === "flip_three" ? (
            <>
              <FannedCardsIcon className="h-8 w-10 shrink-0 sm:h-10 sm:w-12" />
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
              />
            </>
          ) : actionKind === "freeze" ? (
            <>
              <PadlockIcon
                bodyFill={p.lockBody}
                shackleFill={p.lockShackle}
                stroke={p.border}
                className="h-8 w-7 shrink-0 sm:h-9 sm:w-8"
              />
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
              />
            </>
          ) : (
            <div className="h-8 w-full sm:h-9" />
          )}
        </div>

        {actionKind === "flip_three" || actionKind === "freeze" ? (
          <SkewedHelperText color={p.smallText}>{t("actionHelper.playOnActive")}</SkewedHelperText>
        ) : (
          <SkewedHelperText color={p.smallText}>{t("actionHelper.saveUntilNeeded")}</SkewedHelperText>
        )}

        {/* Center banners */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 py-1">
          {actionKind === "flip_three" ? (
            <>
              <div
                className="relative z-[2] -mb-2 w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(55,75,153,0.25)] sm:w-[min(100%,12rem)] sm:px-3 sm:py-1.5"
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-10deg) rotate(-2deg)",
                }}
              >
                <div
                  className="text-center font-heading text-xl font-black uppercase tracking-wide sm:text-3xl"
                  style={{
                    color: p.titleFill,
                    WebkitTextStroke: `1.5px ${p.titleStroke}`,
                    paintOrder: "stroke fill",
                  }}
                >
                  {t("actionTitle.flip_three_line1")}
                </div>
              </div>
              <div
                className="relative z-[1] w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(55,75,153,0.25)] sm:w-[min(100%,12rem)] sm:px-3 sm:py-1.5"
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-10deg) rotate(-2deg)",
                }}
              >
                <div
                  className="text-center font-heading text-xl font-black uppercase tracking-wide sm:text-3xl"
                  style={{
                    color: p.titleFill,
                    WebkitTextStroke: `1.5px ${p.titleStroke}`,
                    paintOrder: "stroke fill",
                  }}
                >
                  {t("actionTitle.flip_three_line2")}
                </div>
              </div>
            </>
          ) : actionKind === "freeze" ? (
            <div
              className="w-[min(100%,11rem)] rounded-sm border-2 px-2 py-2 shadow-[2px_3px_0_rgba(46,64,149,0.2)] sm:w-[min(100%,12.5rem)] sm:px-4 sm:py-2.5"
              style={{
                backgroundColor: p.bannerFill,
                borderColor: p.bannerStroke,
                transform: "skewX(-6deg)",
              }}
            >
              <div
                className="text-center font-heading text-lg font-black uppercase tracking-[0.2em] sm:text-2xl"
                style={{
                  color: p.titleFill,
                  WebkitTextStroke: `1px ${p.titleStroke}`,
                  paintOrder: "stroke fill",
                }}
              >
                {t("actionTitle.freeze")}
              </div>
            </div>
          ) : (
            <>
              <div
                className="relative z-[2] -mb-1.5 w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(61,75,142,0.3)] sm:w-[min(100%,12rem)]"
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-7deg)",
                }}
              >
                <div
                  className="text-center font-heading text-lg font-black uppercase tracking-wide sm:text-2xl"
                  style={{
                    color: p.titleFill,
                    WebkitTextStroke: `1.5px ${p.titleStroke}`,
                    paintOrder: "stroke fill",
                  }}
                >
                  {t("actionTitle.second_chance_line1")}
                </div>
              </div>
              <div
                className="w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(61,75,142,0.3)] sm:w-[min(100%,12rem)]"
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-7deg)",
                }}
              >
                <div
                  className="text-center font-heading text-lg font-black uppercase tracking-wide sm:text-2xl"
                  style={{
                    color: p.titleFill,
                    WebkitTextStroke: `1.5px ${p.titleStroke}`,
                    paintOrder: "stroke fill",
                  }}
                >
                  {t("actionTitle.second_chance_line2")}
                </div>
              </div>
            </>
          )}
        </div>

        {actionKind === "flip_three" || actionKind === "freeze" ? (
          <SkewedHelperText color={p.smallText}>{t("actionHelper.playOnActive")}</SkewedHelperText>
        ) : (
          <SkewedHelperText color={p.smallText}>{t("actionHelper.saveUntilNeeded")}</SkewedHelperText>
        )}

        {/* Bottom row (180° layout) */}
        <div className="flex shrink-0 items-end justify-between gap-1 px-0.5 pb-0.5 sm:px-1">
          {actionKind === "flip_three" ? (
            <>
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
              />
              <FannedCardsIcon className="h-8 w-10 shrink-0 rotate-180 sm:h-10 sm:w-12" />
            </>
          ) : actionKind === "freeze" ? (
            <>
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
              />
              <PadlockIcon
                bodyFill={p.lockBody}
                shackleFill={p.lockShackle}
                stroke={p.border}
                className="h-8 w-7 shrink-0 rotate-180 sm:h-9 sm:w-8"
              />
            </>
          ) : (
            <div className="h-8 w-full sm:h-9" />
          )}
        </div>

        {actionKind === "second_chance" ? (
          <HeartIcon
            fill={p.heartFill}
            stroke={p.border}
            className="absolute bottom-0 right-1 h-5 w-6 rotate-12 opacity-95 sm:bottom-1 sm:right-2 sm:h-6 sm:w-7"
          />
        ) : null}
      </div>
    </CardFrame>
  );
}
