"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CardFrame } from "@/game/cards/card-frame";
import {
  FannedCardsIcon,
  HeartIcon,
  LightningBolt,
  PadlockIcon,
} from "@/game/cards/card-graphics";
import { ACTION_CARD_PALETTES } from "@/game/cards/card-palettes";
import type { ActionKind } from "@/game/logic/card-types";
import { cardTw } from "@/game/logic/card-responsive";

function InstantActionBlock({
  lightningFill,
  lightningStroke,
  labelColor,
  instant,
  action,
  compact = false,
}: {
  lightningFill: string;
  lightningStroke: string;
  labelColor: string;
  instant: string;
  action: string;
  compact?: boolean;
}) {
  return (
    <div className={cardTw(compact, "flex items-center gap-0.5", "sm:gap-1")}>
      <LightningBolt
        fill={lightningFill}
        stroke={lightningStroke}
        className={cardTw(compact, "h-7 w-4 shrink-0", "sm:h-9 sm:w-5")}
      />
      <div
        className={cardTw(
          compact,
          "flex flex-col text-[0.32rem] font-bold uppercase leading-[1.05] tracking-wide",
          "sm:text-[0.38rem]",
        )}
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

function SkewedHelperText({
  children,
  color,
  compact = false,
}: {
  children: ReactNode;
  color: string;
  compact?: boolean;
}) {
  return (
    <p
      className={cardTw(
        compact,
        "text-center text-[0.42rem] font-bold uppercase italic leading-tight tracking-wide",
        "sm:text-[0.48rem]",
      )}
      style={{ color, transform: "skewX(-10deg)" }}
    >
      {children}
    </p>
  );
}

export function ActionCardContent({
  actionKind,
  compact = false,
}: {
  actionKind: ActionKind;
  compact?: boolean;
}) {
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
      compact={compact}
    >
      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-1">
        {actionKind === "second_chance" ? (
          <HeartIcon
            fill={p.heartFill}
            stroke={p.border}
            className={cardTw(
              compact,
              "absolute left-1 top-0 h-5 w-6 -rotate-12 opacity-95",
              "sm:left-2 sm:top-1 sm:h-6 sm:w-7",
            )}
          />
        ) : null}

        {/* Top row */}
        <div
          className={cardTw(
            compact,
            "flex shrink-0 items-start justify-between gap-1 px-0.5 pt-0.5",
            "sm:px-1",
          )}
        >
          {actionKind === "flip_three" ? (
            <>
              <FannedCardsIcon
                className={cardTw(compact, "h-8 w-10 shrink-0", "sm:h-10 sm:w-12")}
              />
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
                compact={compact}
              />
            </>
          ) : actionKind === "freeze" ? (
            <>
              <PadlockIcon
                bodyFill={p.lockBody}
                shackleFill={p.lockShackle}
                stroke={p.border}
                className={cardTw(compact, "h-8 w-7 shrink-0", "sm:h-9 sm:w-8")}
              />
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
                compact={compact}
              />
            </>
          ) : (
            <div className={cardTw(compact, "h-8 w-full", "sm:h-9")} />
          )}
        </div>

        {actionKind === "flip_three" || actionKind === "freeze" ? (
          <SkewedHelperText color={p.smallText} compact={compact}>
            {t("actionHelper.playOnActive")}
          </SkewedHelperText>
        ) : (
          <SkewedHelperText color={p.smallText} compact={compact}>
            {t("actionHelper.saveUntilNeeded")}
          </SkewedHelperText>
        )}

        {/* Center banners */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 py-1">
          {actionKind === "flip_three" ? (
            <>
              <div
                className={cardTw(
                  compact,
                  "relative z-[2] -mb-2 w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(55,75,153,0.25)]",
                  "sm:w-[min(100%,12rem)] sm:px-3 sm:py-1.5",
                )}
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-10deg) rotate(-2deg)",
                }}
              >
                <div
                  className={cardTw(
                    compact,
                    "text-center font-heading text-xl font-black uppercase tracking-wide",
                    "sm:text-3xl",
                  )}
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
                className={cardTw(
                  compact,
                  "relative z-[1] w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(55,75,153,0.25)]",
                  "sm:w-[min(100%,12rem)] sm:px-3 sm:py-1.5",
                )}
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-10deg) rotate(-2deg)",
                }}
              >
                <div
                  className={cardTw(
                    compact,
                    "text-center font-heading text-xl font-black uppercase tracking-wide",
                    "sm:text-3xl",
                  )}
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
              className={cardTw(
                compact,
                "w-[min(100%,11rem)] rounded-sm border-2 px-2 py-2 shadow-[2px_3px_0_rgba(46,64,149,0.2)]",
                "sm:w-[min(100%,12.5rem)] sm:px-4 sm:py-2.5",
              )}
              style={{
                backgroundColor: p.bannerFill,
                borderColor: p.bannerStroke,
                transform: "skewX(-6deg)",
              }}
            >
              <div
                className={cardTw(
                  compact,
                  "text-center font-heading text-lg font-black uppercase tracking-[0.2em]",
                  "sm:text-2xl",
                )}
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
                className={cardTw(
                  compact,
                  "relative z-[2] -mb-1.5 w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(61,75,142,0.3)]",
                  "sm:w-[min(100%,12rem)]",
                )}
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-7deg)",
                }}
              >
                <div
                  className={cardTw(
                    compact,
                    "text-center font-heading text-lg font-black uppercase tracking-wide",
                    "sm:text-2xl",
                  )}
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
                className={cardTw(
                  compact,
                  "w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(61,75,142,0.3)]",
                  "sm:w-[min(100%,12rem)]",
                )}
                style={{
                  backgroundColor: p.bannerFill,
                  borderColor: p.bannerStroke,
                  transform: "skewX(-7deg)",
                }}
              >
                <div
                  className={cardTw(
                    compact,
                    "text-center font-heading text-lg font-black uppercase tracking-wide",
                    "sm:text-2xl",
                  )}
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
          <SkewedHelperText color={p.smallText} compact={compact}>
            {t("actionHelper.playOnActive")}
          </SkewedHelperText>
        ) : (
          <SkewedHelperText color={p.smallText} compact={compact}>
            {t("actionHelper.saveUntilNeeded")}
          </SkewedHelperText>
        )}

        {/* Bottom row (180° layout) */}
        <div
          className={cardTw(
            compact,
            "flex shrink-0 items-end justify-between gap-1 px-0.5 pb-0.5",
            "sm:px-1",
          )}
        >
          {actionKind === "flip_three" ? (
            <>
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
                compact={compact}
              />
              <FannedCardsIcon
                className={cardTw(compact, "h-8 w-10 shrink-0 rotate-180", "sm:h-10 sm:w-12")}
              />
            </>
          ) : actionKind === "freeze" ? (
            <>
              <InstantActionBlock
                lightningFill={p.lightningFill}
                lightningStroke={lightningStroke}
                labelColor={p.smallText}
                instant={instant}
                action={actionWord}
                compact={compact}
              />
              <PadlockIcon
                bodyFill={p.lockBody}
                shackleFill={p.lockShackle}
                stroke={p.border}
                className={cardTw(compact, "h-8 w-7 shrink-0 rotate-180", "sm:h-9 sm:w-8")}
              />
            </>
          ) : (
            <div className={cardTw(compact, "h-8 w-full", "sm:h-9")} />
          )}
        </div>

        {actionKind === "second_chance" ? (
          <HeartIcon
            fill={p.heartFill}
            stroke={p.border}
            className={cardTw(
              compact,
              "absolute bottom-0 right-1 h-5 w-6 rotate-12 opacity-95",
              "sm:bottom-1 sm:right-2 sm:h-6 sm:w-7",
            )}
          />
        ) : null}
      </div>
    </CardFrame>
  );
}
