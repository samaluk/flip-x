"use client";

import type { ReactNode } from "react";
import { useExtracted } from "next-intl";

import { ActionBannerStack } from "@/game/cards/action-banner";
import {
  FLIP_THREE_BANNER_BOTTOM,
  FLIP_THREE_BANNER_TOP,
  FREEZE_BANNER,
  SECOND_CHANCE_BANNER_BOTTOM,
  SECOND_CHANCE_BANNER_TOP,
} from "@/game/cards/action-banner-styles";
import type { ActionBannerStyle } from "@/game/cards/action-banner-styles";
import { CardFrame } from "@/game/cards/card-frame";
import { FannedCardsIcon, HeartIcon, LightningBolt, PadlockIcon } from "@/game/cards/card-graphics";
import type { ActionCardPalette } from "@/game/cards/card-palettes";
import { ACTION_CARD_PALETTES } from "@/game/cards/card-palettes";
import { cardTw } from "@/game/cards/card-responsive";
import type { ActionKind } from "@/game/logic/card-types";

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

/**
 * Mirrored corner row shared by every action card: the icon side sits on
 * the leading edge at the top and on the trailing edge (rotated 180°)
 * at the bottom, with the instant-action block in the opposite corner.
 */
function ActionIconRow({
  icon,
  children,
  flip = false,
  compact = false,
}: {
  /** Leading (top) or trailing rotated (bottom) icon; a spacer for second-chance cards */
  icon: ReactNode;
  children?: ReactNode;
  flip?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cardTw(
        compact,
        flip
          ? "flex shrink-0 items-end justify-between gap-1 px-0.5 pb-0.5"
          : "flex shrink-0 items-start justify-between gap-1 px-0.5 pt-0.5",
        "sm:px-1",
      )}
    >
      {flip ? (
        <>
          {children}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </div>
  );
}

type ActionFaceProps = {
  palette: ActionCardPalette;
  compact: boolean;
};

type InstantActionFaceProps = ActionFaceProps & {
  instant: string;
  action: string;
  icon: ReactNode;
  flippedIcon: ReactNode;
  lightningStroke: string;
  bannerTopStyle: ActionBannerStyle;
  bannerTopTitle: ReactNode;
  bannerBottomStyle?: ActionBannerStyle;
  bannerBottomTitle?: ReactNode;
};

function InstantActionFace({
  palette,
  compact,
  instant,
  action,
  icon,
  flippedIcon,
  lightningStroke,
  bannerTopStyle,
  bannerTopTitle,
  bannerBottomStyle,
  bannerBottomTitle,
}: InstantActionFaceProps) {
  const t = useExtracted("Cards");
  const actionBlock = (
    <InstantActionBlock
      lightningFill={palette.lightningFill}
      lightningStroke={lightningStroke}
      labelColor={palette.smallText}
      instant={instant}
      action={action}
      compact={compact}
    />
  );
  return (
    <>
      <ActionIconRow compact={compact} icon={icon}>
        {actionBlock}
      </ActionIconRow>
      <SkewedHelperText color={palette.smallText} compact={compact}>
        {t("PLAY ON AN ACTIVE PLAYER")}
      </SkewedHelperText>
      <ActionBannerStack
        palette={palette}
        compact={compact}
        topStyle={bannerTopStyle}
        topTitle={bannerTopTitle}
        bottomStyle={bannerBottomStyle}
        bottomTitle={bannerBottomTitle}
      />
      <SkewedHelperText color={palette.smallText} compact={compact}>
        {t("PLAY ON AN ACTIVE PLAYER")}
      </SkewedHelperText>
      <ActionIconRow flip compact={compact} icon={flippedIcon}>
        {actionBlock}
      </ActionIconRow>
    </>
  );
}

function SecondChanceFace({ palette, compact }: ActionFaceProps) {
  const t = useExtracted("Cards");
  const spacer = <div className={cardTw(compact, "h-8 w-full", "sm:h-9")} />;
  return (
    <>
      <HeartIcon
        fill={palette.heartFill}
        stroke={palette.border}
        className={cardTw(
          compact,
          "absolute left-1 top-0 h-5 w-6 -rotate-12 opacity-95",
          "sm:left-2 sm:top-1 sm:h-6 sm:w-7",
        )}
      />
      <ActionIconRow compact={compact} icon={spacer} />
      <SkewedHelperText color={palette.smallText} compact={compact}>
        {t("SAVE THIS CARD UNTIL NEEDED")}
      </SkewedHelperText>
      <ActionBannerStack
        palette={palette}
        compact={compact}
        topStyle={SECOND_CHANCE_BANNER_TOP}
        topTitle={t("SECOND")}
        bottomStyle={SECOND_CHANCE_BANNER_BOTTOM}
        bottomTitle={t("CHANCE")}
      />
      <SkewedHelperText color={palette.smallText} compact={compact}>
        {t("SAVE THIS CARD UNTIL NEEDED")}
      </SkewedHelperText>
      <ActionIconRow flip compact={compact} icon={spacer} />
      <HeartIcon
        fill={palette.heartFill}
        stroke={palette.border}
        className={cardTw(
          compact,
          "absolute bottom-0 right-1 h-5 w-6 rotate-12 opacity-95",
          "sm:bottom-1 sm:right-2 sm:h-6 sm:w-7",
        )}
      />
    </>
  );
}

type InstantActionFaceContentProps = ActionFaceProps & {
  instant: string;
  action: string;
  bannerTopTitle: ReactNode;
  bannerBottomTitle?: ReactNode;
};

function FlipThreeActionFace({
  palette,
  compact,
  instant,
  action,
  bannerTopTitle,
  bannerBottomTitle,
}: InstantActionFaceContentProps) {
  return (
    <InstantActionFace
      palette={palette}
      compact={compact}
      instant={instant}
      action={action}
      lightningStroke={palette.border}
      icon={<FannedCardsIcon className={cardTw(compact, "h-8 w-10 shrink-0", "sm:h-10 sm:w-12")} />}
      flippedIcon={
        <FannedCardsIcon
          className={cardTw(compact, "h-8 w-10 shrink-0 rotate-180", "sm:h-10 sm:w-12")}
        />
      }
      bannerTopStyle={FLIP_THREE_BANNER_TOP}
      bannerTopTitle={bannerTopTitle}
      bannerBottomStyle={FLIP_THREE_BANNER_BOTTOM}
      bannerBottomTitle={bannerBottomTitle}
    />
  );
}

function FreezeActionFace({
  palette,
  compact,
  instant,
  action,
  bannerTopTitle,
}: InstantActionFaceContentProps) {
  return (
    <InstantActionFace
      palette={palette}
      compact={compact}
      instant={instant}
      action={action}
      lightningStroke={palette.orange}
      icon={
        <PadlockIcon
          bodyFill={palette.lockBody}
          shackleFill={palette.lockShackle}
          stroke={palette.border}
          className={cardTw(compact, "h-8 w-7 shrink-0", "sm:h-9 sm:w-8")}
        />
      }
      flippedIcon={
        <PadlockIcon
          bodyFill={palette.lockBody}
          shackleFill={palette.lockShackle}
          stroke={palette.border}
          className={cardTw(compact, "h-8 w-7 shrink-0 rotate-180", "sm:h-9 sm:w-8")}
        />
      }
      bannerTopStyle={FREEZE_BANNER}
      bannerTopTitle={bannerTopTitle}
    />
  );
}

function ActionCardFace({
  actionKind,
  palette,
  compact,
}: {
  actionKind: ActionKind;
  palette: ActionCardPalette;
  compact: boolean;
}) {
  const t = useExtracted("Cards");
  const instant = t("INSTANT");
  const actionWord = t("ACTION");

  return actionKind === "flip_three" ? (
    <FlipThreeActionFace
      palette={palette}
      compact={compact}
      instant={instant}
      action={actionWord}
      bannerTopTitle={t("FLIP")}
      bannerBottomTitle={t("THREE")}
    />
  ) : actionKind === "freeze" ? (
    <FreezeActionFace
      palette={palette}
      compact={compact}
      instant={instant}
      action={actionWord}
      bannerTopTitle={t("FREEZE")}
    />
  ) : (
    <SecondChanceFace palette={palette} compact={compact} />
  );
}

export function ActionCardContent({
  actionKind,
  compact = false,
}: {
  actionKind: ActionKind;
  compact?: boolean;
}) {
  const palette = ACTION_CARD_PALETTES[actionKind];
  return (
    <CardFrame
      borderColor={palette.border}
      backgroundColor={palette.bg}
      backgroundOverlay={palette.bgGradient}
      className="h-full"
      compact={compact}
    >
      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-1">
        <ActionCardFace actionKind={actionKind} palette={palette} compact={compact} />
      </div>
    </CardFrame>
  );
}
